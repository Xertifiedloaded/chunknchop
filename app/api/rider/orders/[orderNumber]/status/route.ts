import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin, isAdminUser } from '@/lib/admin-api';
import { findMongoDocument, updateMongoDocument } from '@/lib/mongo-collections';
import { publishOrderEvent } from '@/lib/pusher';
import { notifyAdmins, notifyUsers } from '@/lib/notifications';
import { prisma } from '@/lib/prisma';
type O = { _id: string; riderId?: string; status?: string };
type Ctx = { params: Promise<{ orderNumber: string }> };
const schema = z
  .object({ status: z.enum(['picked_up', 'out_for_delivery', 'delivered']) })
  .strict();
const next: Record<string, string> = {
  assigned: 'picked_up',
  picked_up: 'out_for_delivery',
  out_for_delivery: 'delivered',
};
export async function POST(req: Request, { params }: Ctx) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const s = await getSession(await headers());
  if (!s?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (s.user.role !== 'rider' && !isAdminUser(s.user))
    return NextResponse.json({ error: 'Rider access required' }, { status: 403 });
  const { orderNumber } = await params;
  if (!/^CNC-[A-F\d]{32}$/i.test(orderNumber))
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Invalid delivery status' }, { status: 400 });
  const order = await findMongoDocument<O>('StoreOrder', orderNumber);
  if (!order || order.riderId !== s.user.id)
    return NextResponse.json({ error: 'Assigned order not found' }, { status: 404 });
  if (next[order.status ?? ''] !== p.data.status)
    return NextResponse.json({ error: 'Delivery status is out of sequence' }, { status: 409 });
  const at = new Date().toISOString();
  const result = await updateMongoDocument(
    'StoreOrder',
    { _id: orderNumber, riderId: s.user.id, status: order.status ?? '' },
    {
      $set: {
        status: p.data.status,
        statusUpdatedAt: at,
        ...(p.data.status === 'delivered' ? { deliveredAt: at } : {}),
      },
      $push: { statusHistory: { status: p.data.status, at, note: 'Updated by assigned rider' } },
    },
  );
  if ((result as { n?: number }).n === 0)
    return NextResponse.json({ error: 'Order status changed; refresh' }, { status: 409 });
  const customerOrder = await findMongoDocument<{ userId?: string }>('StoreOrder', orderNumber);
  const statusLabels: Record<string, string> = {
    picked_up: 'picked up',
    out_for_delivery: 'on the way',
    delivered: 'delivered',
  };
  if (customerOrder?.userId)
    await notifyUsers([customerOrder.userId], {
      title: `Order ${statusLabels[p.data.status]}`,
      body: `Your rider has ${statusLabels[p.data.status]} your order ${orderNumber}.`,
      url: `/account/orders/${encodeURIComponent(orderNumber)}`,
      tag: `status-${orderNumber}-${p.data.status}`,
    }).catch(() => undefined);
  if (p.data.status === 'delivered')
    await notifyAdmins({
      title: 'Delivery completed',
      body: `Rider marked order ${orderNumber} as delivered.`,
      url: '/admin/orders',
      tag: `delivered-${orderNumber}`,
    }).catch(() => undefined);
  await publishOrderEvent(orderNumber, 'delivery.status', {
    orderNumber,
    status: p.data.status,
    at,
  }).catch(() => undefined);
  if (p.data.status === 'delivered')
    await prisma.riderProfile.updateMany({
      where: { userId: s.user.id },
      data: { isAvailable: true },
    });
  return NextResponse.json({ orderNumber, status: p.data.status, at });
}
