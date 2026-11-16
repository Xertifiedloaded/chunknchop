import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { findMongoDocument } from '@/lib/mongo-collections';

type StoredOrder = Record<string, unknown> & { _id: string; userId?: string };
type RouteContext = { params: Promise<{ orderNumber: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { orderNumber } = await params;
  if (!/^CNC-[A-F\d]{32}$/i.test(orderNumber))
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const order = await findMongoDocument<StoredOrder>('StoreOrder', orderNumber);
  if (!order || order.userId !== session.user.id)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const {
    userId: _userId,
    email: _email,
    paymentReference: _paymentReference,
    paymentTransactionId: _paymentTransactionId,
    checkoutRequestId: _checkoutRequestId,
    ...customerOrder
  } = order;
  return NextResponse.json(
    { order: { ...customerOrder, orderNumber: order._id } },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
