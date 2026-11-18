import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { hasSameOrigin, isAdminUser } from '@/lib/admin-api';
import { findMongoDocument, updateMongoDocument } from '@/lib/mongo-collections';
import { publishOrderEvent } from '@/lib/pusher';

type O = {
  _id: string;
  status?: string;
  paymentStatus?: string;
  delivery?: { addressLine1?: string; area?: string; city?: string; region?: string };
};
type Ctx = { params: Promise<{ orderNumber: string }> };

const isPickup = (o: O) => {
  const d = o.delivery;
  return !d || !(d.addressLine1 || d.area || d.city || d.region);
};

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

  const order = await findMongoDocument<O>('StoreOrder', orderNumber);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (!isPickup(order))
    return NextResponse.json({ error: 'This is a delivery order, not a pickup' }, { status: 409 });
  if (order.paymentStatus !== 'paid')
    return NextResponse.json({ error: 'Order has not been paid' }, { status: 409 });
  if (['collected', 'cancelled', 'refunded', 'delivered'].includes(order.status ?? ''))
    return NextResponse.json({ error: `Order is already ${order.status}` }, { status: 409 });

  const at = new Date().toISOString();
   
  const result = await updateMongoDocument(
    'StoreOrder',
    { _id: orderNumber, status: order.status ?? '' },
    {
      $set: { status: 'collected', statusUpdatedAt: at },
      $push: { statusHistory: { status: 'collected', at, note: 'Picked up by customer' } },
    },
  );
  if ((result as { n?: number }).n === 0)
    return NextResponse.json({ error: 'Order status changed; refresh' }, { status: 409 });

  await publishOrderEvent(orderNumber, 'order.status', {
    orderNumber,
    status: 'collected',
    at,
  }).catch(() => undefined);

  return NextResponse.json({ orderNumber, status: 'collected', at });
}