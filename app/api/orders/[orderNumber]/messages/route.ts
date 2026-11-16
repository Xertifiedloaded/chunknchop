import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
import { findMongoDocument, findMongoDocuments } from '@/lib/mongo-collections';

type OrderParticipant = {
  _id: string;
  userId?: string;
  riderId?: string;
  riderName?: string;
  customerName?: string;
  paymentStatus?: string;
  status?: string;
};
type StoredMessage = {
  _id: string;
  senderRole?: string;
  senderName?: string;
  message?: string;
  createdAt?: string;
};
type RouteContext = { params: Promise<{ orderNumber: string }> };
const messageSchema = z.object({ message: z.string().trim().min(1).max(1000) }).strict();

async function getConversationParticipant(orderNumber: string, userId: string) {
  const order = await findMongoDocument<OrderParticipant>('StoreOrder', orderNumber);
  if (!order || (order.userId !== userId && order.riderId !== userId)) return null;
  return order;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { orderNumber } = await params;
  if (!/^CNC-[A-F\d]{32}$/i.test(orderNumber))
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const order = await getConversationParticipant(orderNumber, session.user.id);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const messages = await findMongoDocuments<StoredMessage>('OrderMessage', { orderNumber }, 100, {
    createdAt: 1,
  });
  const canChat =
    order.paymentStatus === 'paid' &&
    Boolean(order.riderId) &&
    !['delivered', 'cancelled'].includes(order.status ?? '');
  return NextResponse.json(
    {
      canChat,
      counterpartName:
        session.user.id === order.userId
          ? (order.riderName ?? 'Your rider')
          : (order.customerName ?? 'Customer'),
      messages: messages.map(({ _id, senderRole, senderName, message, createdAt }) => ({
        id: _id,
        senderRole,
        senderName,
        message,
        createdAt,
      })),
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { orderNumber } = await params;
  if (!/^CNC-[A-F\d]{32}$/i.test(orderNumber))
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Messages must be between 1 and 1000 characters' },
      { status: 400 },
    );

  const order = await getConversationParticipant(orderNumber, session.user.id);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (
    order.paymentStatus !== 'paid' ||
    !order.riderId ||
    ['delivered', 'cancelled'].includes(order.status ?? '')
  ) {
    return NextResponse.json({ error: 'Order messaging is unavailable' }, { status: 409 });
  }

  const message = {
    _id: randomUUID(),
    orderNumber,
    senderId: session.user.id,
    senderRole: session.user.id === order.userId ? 'customer' : 'rider',
    senderName:
      session.user.id === order.userId
        ? (order.customerName ?? 'Customer')
        : (order.riderName ?? 'Rider'),
    message: parsed.data.message,
    createdAt: new Date().toISOString(),
  };
  await prisma.$runCommandRaw({ insert: 'OrderMessage', documents: [message], ordered: true });
  return NextResponse.json(
    {
      message: {
        id: message._id,
        senderRole: message.senderRole,
        senderName: message.senderName,
        message: message.message,
        createdAt: message.createdAt,
      },
    },
    { status: 201 },
  );
}
