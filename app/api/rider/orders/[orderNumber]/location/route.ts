import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
import { findMongoDocument, updateMongoDocument } from '@/lib/mongo-collections';
import { publishOrderEvent } from '@/lib/pusher';
type O = { _id: string; riderId?: string; status?: string };
type Ctx = { params: Promise<{ orderNumber: string }> };
const schema = z
  .object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })
  .strict();
export async function POST(req: Request, { params }: Ctx) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const s = await getSession(await headers());
  if (!s?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (s.user.role !== 'rider')
    return NextResponse.json(
      { error: 'Only rider accounts can share delivery location' },
      { status: 403 },
    );
  const { orderNumber } = await params;
  if (!/^CNC-[A-F\d]{32}$/i.test(orderNumber))
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  const order = await findMongoDocument<O>('StoreOrder', orderNumber);
  if (!order || order.riderId !== s.user.id)
    return NextResponse.json({ error: 'Assigned order not found' }, { status: 404 });
  if (['delivered', 'cancelled'].includes(order.status ?? ''))
    return NextResponse.json({ error: 'Delivery is complete' }, { status: 409 });
  const updatedAt = new Date().toISOString();
  const location = { ...p.data, updatedAt };
  const result = await updateMongoDocument(
    'StoreOrder',
    { _id: orderNumber, riderId: s.user.id },
    { $set: { riderLocation: location } },
  );
  if ((result as { n?: number }).n === 0)
    return NextResponse.json({ error: 'Assignment changed' }, { status: 409 });
  await prisma.riderProfile.updateMany({
    where: { userId: s.user.id },
    data: {
      currentLatitude: p.data.latitude,
      currentLongitude: p.data.longitude,
      locationUpdatedAt: new Date(updatedAt),
    },
  });
  await publishOrderEvent(orderNumber, 'delivery.location', location).catch(() => undefined);
  return NextResponse.json({ updatedAt });
}
