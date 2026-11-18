import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin, isAdminUser } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
import { findMongoDocument, updateMongoDocument } from '@/lib/mongo-collections';
import { publishOrderEvent } from '@/lib/pusher';
import { notifyUsers } from '@/lib/notifications';
type StoredOrder = {
  _id: string;
  userId?: string;
  paymentStatus?: string;
  status?: string;
  deliveryZoneId?: string;
  delivery?: { city?: string };
};
type Ctx = { params: Promise<{ orderNumber: string }> };
const input = z.object({ email: z.string().trim().email().max(254) }).strict();
export async function POST(req: Request, { params }: Ctx) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const s = await getSession(await headers());
  if (!s?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!isAdminUser(s.user))
    return NextResponse.json({ error: 'Administrator access required' }, { status: 403 });
  const { orderNumber } = await params;
  if (!/^CNC-[A-F\d]{32}$/i.test(orderNumber))
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const p = input.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: 'Enter a valid rider email address' }, { status: 400 });
  const order = await findMongoDocument<StoredOrder>('StoreOrder', orderNumber);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.paymentStatus !== 'paid' || ['delivered', 'cancelled'].includes(order.status ?? ''))
    return NextResponse.json(
      { error: 'Only paid, incomplete orders can be assigned' },
      { status: 409 },
    );
  const user = await prisma.user.findUnique({
    where: { email: p.data.email.toLowerCase() },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) return NextResponse.json({ error: 'Rider account not found' }, { status: 404 });
  if (user.role !== 'rider')
    return NextResponse.json(
      {
        error:
          'Only an existing account with the rider role can be assigned. Customers are never promoted automatically.',
      },
      { status: 403 },
    );
  const profile = await prisma.riderProfile.findUnique({
    where: { userId: user.id },
    include: { zones: true },
  });
  if (
    !profile ||
    profile.verificationStatus !== 'approved' ||
    !profile.isActive ||
    !profile.isAvailable
  )
    return NextResponse.json(
      { error: 'Rider must have an approved, active and available profile' },
      { status: 409 },
    );

  let orderZoneIds: string[] = [];
  if (order.deliveryZoneId) {
    orderZoneIds = [order.deliveryZoneId];
  } else if (order.delivery?.city?.trim()) {
    const zones = await prisma.deliveryZone.findMany({
      where: { active: true, city: { equals: order.delivery.city.trim(), mode: 'insensitive' } },
      select: { id: true },
    });
    orderZoneIds = zones.map((z) => z.id);
  }
  if (!orderZoneIds.length)
    return NextResponse.json(
      {
        error: `No delivery zone is set up for ${order.delivery?.city || 'this address'}. Add a delivery zone first.`,
      },
      { status: 409 },
    );
  if (!profile.zones.some((z) => orderZoneIds.includes(z.zoneId)))
    return NextResponse.json({ error: 'Rider does not serve this delivery zone' }, { status: 409 });

  const at = new Date().toISOString();
  const result = await updateMongoDocument(
    'StoreOrder',
    { _id: orderNumber, paymentStatus: 'paid', status: { $nin: ['delivered', 'cancelled'] } },
    {
      $set: {
        riderId: user.id,
        riderName: user.name,
        riderEmail: user.email,
        riderLocation: null,
        status: 'assigned',
        assignedAt: at,
        assignmentMode: 'manual',
      },
      $push: {
        statusHistory: { status: 'assigned', at, note: `Manually assigned to ${user.name}` },
      },
    },
  );
  if ((result as { n?: number }).n === 0)
    return NextResponse.json({ error: 'Assignment could not be saved' }, { status: 409 });
  await prisma.riderProfile.update({ where: { id: profile.id }, data: { isAvailable: false } });
  await notifyUsers([user.id], {
    title: 'New delivery assigned',
    body: `Order ${orderNumber} has been assigned to you.`,
    url: '/rider',
    tag: `assigned-rider-${orderNumber}`,
  }).catch(() => undefined);
  if (order.userId)
    await notifyUsers([order.userId], {
      title: 'Rider assigned',
      body: `${user.name} has been assigned to your order ${orderNumber}.`,
      url: `/account/orders/${encodeURIComponent(orderNumber)}/track`,
      tag: `assigned-customer-${orderNumber}`,
    }).catch(() => undefined);
  await publishOrderEvent(orderNumber, 'delivery.assigned', {
    orderNumber,
    status: 'assigned',
    rider: {
      name: user.name,
      photoUrl: profile.photoUrl,
      vehicleType: profile.vehicleType,
      vehicleColor: profile.vehicleColor,
      plateNumber: profile.plateNumber,
    },
  }).catch(() => undefined);
  return NextResponse.json({
    orderNumber,
    rider: { name: user.name, email: user.email },
    status: 'assigned',
  });
}
