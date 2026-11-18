import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { requireAdminApi, hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
import {
  findMongoDocument,
  findMongoDocuments,
  updateMongoDocument,
} from '@/lib/mongo-collections';
import { findEligibleRiders } from '@/lib/delivery-assignment';
import { publishOrderEvent } from '@/lib/pusher';
type Order = {
  _id: string;
  userId?: string;
  paymentStatus?: string;
  status?: string;
  riderId?: string;
  deliveryZoneId?: string;
  area?: string;
  city?: string;
  region?: string;
  deliveryAddress?: { area?: string; city?: string; state?: string };
  riderLocation?: unknown;
};
const input = z
  .object({
    orderNumber: z.string().regex(/^CNC-[A-F\d]{32}$/i),
    mode: z.enum(['automatic', 'manual']).default('manual'),
    riderUserId: z.string().optional(),
    zoneId: z.string().optional(),
  })
  .strict();
async function activeCount(userId: string) {
  const rows = await findMongoDocuments<{ _id: string }>(
    'StoreOrder',
    { riderId: userId, status: { $in: ['assigned', 'picked_up', 'out_for_delivery'] } },
    100,
  );
  return rows.length;
}

export async function GET(req: Request) {
  const admin = await requireAdminApi();
  if (admin.response) return admin.response;
  const url = new URL(req.url);
  const orderNumber = url.searchParams.get('orderNumber') ?? '';
  if (!/^CNC-[A-F\d]{32}$/i.test(orderNumber))
    return NextResponse.json({ error: 'Enter a valid order number' }, { status: 400 });
  const order = await findMongoDocument<Order>('StoreOrder', orderNumber);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.paymentStatus !== 'paid')
    return NextResponse.json({ error: 'Only paid orders can be assigned' }, { status: 409 });
  const zoneId = order.deliveryZoneId;
  if (!zoneId)
    return NextResponse.json({ error: 'Order has no configured delivery zone' }, { status: 409 });
  const settings = await findMongoDocument<{ maxActiveDeliveries?: number }>(
    'DeliverySettings',
    'delivery-settings',
  );
  const candidates = await findEligibleRiders(zoneId);
  const result = await Promise.all(
    candidates.map(async (rider) => {
      const active = await activeCount(rider.userId);
      return {
        id: rider.userId,
        name: rider.user.name,
        email: rider.user.email,
        photoUrl: rider.photoUrl,
        phone: rider.phone,
        vehicleType: rider.vehicleType,
        vehicleColor: rider.vehicleColor,
        plateNumber: rider.plateNumber,
        activeDeliveries: active,
        eligible: active < (settings?.maxActiveDeliveries ?? 1),
      };
    }),
  );
  return NextResponse.json({ orderNumber, zoneId, riders: result.filter((r) => r.eligible) });
}

export async function POST(req: Request) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const admin = await requireAdminApi();
  if (admin.response) return admin.response;
  const p = input.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: 'Provide an order and valid assignment mode' },
      { status: 400 },
    );
  const order = await findMongoDocument<Order>('StoreOrder', p.data.orderNumber);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.paymentStatus !== 'paid')
    return NextResponse.json({ error: 'Only paid orders can be assigned' }, { status: 409 });
  if (['delivered', 'cancelled'].includes(order.status ?? ''))
    return NextResponse.json({ error: 'Order is already complete' }, { status: 409 });
  const settings = await findMongoDocument<{
    assignmentMode?: string;
    maxActiveDeliveries?: number;
  }>('DeliverySettings', 'delivery-settings');
  const mode = p.data.mode;
  const zoneId = p.data.zoneId ?? order.deliveryZoneId;
  if (!zoneId)
    return NextResponse.json(
      {
        error:
          'This order has no resolved delivery zone. Add/resolve the zone before assigning a rider.',
      },
      { status: 409 },
    );
  let eligible = await findEligibleRiders(zoneId);
  const max = settings?.maxActiveDeliveries ?? 1;
  const capacity = await Promise.all(
    eligible.map(async (r) => ({ r, count: await activeCount(r.userId) })),
  );
  eligible = capacity.filter((x) => x.count < max).map((x) => x.r);
  let selected =
    mode === 'manual'
      ? eligible.find((r) => r.userId === p.data.riderUserId)
      : eligible.sort((a, b) => {
          const ac = capacity.find((x) => x.r.id === a.id)?.count ?? 0;
          const bc = capacity.find((x) => x.r.id === b.id)?.count ?? 0;
          return ac - bc;
        })[0];
  if (mode === 'manual' && !selected)
    return NextResponse.json(
      { error: 'Selected user is not an eligible rider for this zone' },
      { status: 409 },
    );
  if (mode === 'automatic' && !selected)
    return NextResponse.json(
      {
        error:
          'No eligible rider is currently available. The order remains unassigned for admin action.',
      },
      { status: 409 },
    );
  if (!selected) return NextResponse.json({ error: 'No eligible rider found' }, { status: 409 });
  const at = new Date().toISOString();
  const result = await updateMongoDocument(
    'StoreOrder',
    { _id: order._id, paymentStatus: 'paid', status: { $nin: ['delivered', 'cancelled'] } },
    {
      $set: {
        riderId: selected.userId,
        riderName: selected.user.name,
        riderEmail: selected.user.email,
        riderLocation: null,
        deliveryZoneId: zoneId,
        status: 'assigned',
        assignedAt: at,
        assignmentMode: mode,
      },
      $push: {
        statusHistory: {
          status: 'assigned',
          at,
          note: `Assigned to ${selected.user.name} (${mode})`,
        },
      },
    },
  );
  if ((result as { n?: number }).n === 0)
    return NextResponse.json(
      { error: 'Order changed during assignment. Refresh and retry.' },
      { status: 409 },
    );
  await prisma.riderProfile.update({ where: { id: selected.id }, data: { isAvailable: false } });
  await publishOrderEvent(order._id, 'delivery.assigned', {
    orderNumber: order._id,
    status: 'assigned',
    rider: {
      name: selected.user.name,
      photoUrl: selected.photoUrl,
      vehicleType: selected.vehicleType,
      vehicleColor: selected.vehicleColor,
      plateNumber: selected.plateNumber,
    },
  }).catch(() => undefined);
  return NextResponse.json({
    orderNumber: order._id,
    mode,
    status: 'assigned',
    rider: {
      id: selected.userId,
      name: selected.user.name,
      email: selected.user.email,
      vehicleType: selected.vehicleType,
      vehicleColor: selected.vehicleColor,
      plateNumber: selected.plateNumber,
    },
  });
}
