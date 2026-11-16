import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin, isAdminUser } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
import { findMongoDocument, updateMongoDocument } from '@/lib/mongo-collections';

type StoredOrder = {
  _id: string;
  paymentStatus?: string;
  status?: string;
  riderId?: string;
  statusHistory?: unknown[];
};
type RouteContext = { params: Promise<{ orderNumber: string }> };
const inputSchema = z.object({ email: z.string().trim().email().max(254) }).strict();

export async function POST(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!isAdminUser(session.user))
    return NextResponse.json({ error: 'Administrator access required' }, { status: 403 });

  const { orderNumber } = await params;
  if (!/^CNC-[A-F\d]{32}$/i.test(orderNumber))
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const body = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: 'Enter a valid rider email address' }, { status: 400 });

  const order = await findMongoDocument<StoredOrder>('StoreOrder', orderNumber);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.paymentStatus !== 'paid')
    return NextResponse.json(
      { error: 'Only paid orders can be assigned to a rider' },
      { status: 409 },
    );
  if (['delivered', 'cancelled'].includes(order.status ?? ''))
    return NextResponse.json({ error: 'This order is already complete' }, { status: 409 });

  const rider = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!rider)
    return NextResponse.json(
      { error: 'That email does not belong to a registered account' },
      { status: 404 },
    );
  if (rider.role === 'admin' || isAdminUser(rider))
    return NextResponse.json(
      { error: 'Choose a customer account for rider access' },
      { status: 400 },
    );

  const riderAccount =
    rider.role === 'rider'
      ? rider
      : await prisma.user.update({
          where: { id: rider.id },
          data: { role: 'rider' },
          select: { id: true, name: true, email: true, role: true },
        });
  const now = new Date().toISOString();
  const result = (await updateMongoDocument(
    'StoreOrder',
    { _id: orderNumber },
    {
      $set: {
        riderId: riderAccount.id,
        riderName: riderAccount.name,
        riderEmail: riderAccount.email,
        riderLocation: null,
        status: 'assigned',
        assignedAt: now,
      },
      $push: {
        statusHistory: {
          status: 'assigned',
          at: now,
          note: `Assigned to ${riderAccount.name || riderAccount.email}`,
        },
      },
    },
  )) as { n?: number };

  if (result.n === 0)
    return NextResponse.json({ error: 'Order assignment could not be saved' }, { status: 409 });
  return NextResponse.json({
    orderNumber,
    rider: { name: riderAccount.name, email: riderAccount.email },
    status: 'assigned',
  });
}
