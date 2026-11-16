import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin, isAdminUser } from '@/lib/admin-api';
import { findMongoDocument, updateMongoDocument } from '@/lib/mongo-collections';

type StoredOrder = { _id: string; riderId?: string; status?: string };
type RouteContext = { params: Promise<{ orderNumber: string }> };
const locationSchema = z
  .object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })
  .strict();

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
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: 'Location coordinates are invalid' }, { status: 400 });

  const order = await findMongoDocument<StoredOrder>('StoreOrder', orderNumber);
  if (!order || order.riderId !== session.user.id)
    return NextResponse.json({ error: 'Assigned order not found' }, { status: 404 });
  if (['delivered', 'cancelled'].includes(order.status ?? ''))
    return NextResponse.json({ error: 'This delivery is complete' }, { status: 409 });

  const updatedAt = new Date().toISOString();
  const result = (await updateMongoDocument(
    'StoreOrder',
    { _id: orderNumber, riderId: session.user.id },
    {
      $set: { riderLocation: { ...parsed.data, updatedAt } },
    },
  )) as { n?: number };
  if (result.n === 0)
    return NextResponse.json({ error: 'Order assignment changed' }, { status: 409 });
  return NextResponse.json({ updatedAt });
}
