import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin, isAdminUser } from '@/lib/admin-api';
import { findMongoDocument, updateMongoDocument } from '@/lib/mongo-collections';

type StoredOrder = { _id: string; riderId?: string; status?: string; statusHistory?: unknown[] };
type RouteContext = { params: Promise<{ orderNumber: string }> };
const statusSchema = z
  .object({ status: z.enum(['picked_up', 'out_for_delivery', 'delivered']) })
  .strict();
const allowedNextStatus: Record<string, string> = {
  assigned: 'picked_up',
  picked_up: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

export async function POST(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (session.user.role !== 'rider' && !isAdminUser(session.user))
    return NextResponse.json({ error: 'Rider access required' }, { status: 403 });

  const { orderNumber } = await params;
  if (!/^CNC-[A-F\d]{32}$/i.test(orderNumber))
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: 'Choose a valid delivery status' }, { status: 400 });

  const order = await findMongoDocument<StoredOrder>('StoreOrder', orderNumber);
  if (!order || order.riderId !== session.user.id)
    return NextResponse.json({ error: 'Assigned order not found' }, { status: 404 });
  if (allowedNextStatus[order.status ?? ''] !== parsed.data.status) {
    return NextResponse.json({ error: 'This delivery status is out of sequence' }, { status: 409 });
  }

  const at = new Date().toISOString();
  const result = (await updateMongoDocument(
    'StoreOrder',
    {
      _id: orderNumber,
      riderId: session.user.id,
      status: order.status ?? '',
    },
    {
      $set: { status: parsed.data.status, statusUpdatedAt: at },
      $push: {
        statusHistory: { status: parsed.data.status, at, note: 'Updated by the assigned rider' },
      },
    },
  )) as { n?: number };
  if (result.n === 0)
    return NextResponse.json(
      { error: 'Order status changed; refresh and try again' },
      { status: 409 },
    );
  return NextResponse.json({ orderNumber, status: parsed.data.status, at });
}
