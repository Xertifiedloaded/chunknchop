import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { findMongoDocuments } from '@/lib/mongo-collections';

type OrderItem = { name?: unknown; quantity?: unknown; priceCents?: unknown; unit?: unknown };
type StoredOrder = {
  _id: string;
  userId?: string;
  email?: string;
  status?: string;
  paymentStatus?: string;
  currency?: string;
  subtotalCents?: number;
  items?: OrderItem[];
  createdAt?: string;
  paidAt?: string;
  statusHistory?: Array<{ status?: string; at?: string; note?: string }>;
  riderLocation?: { latitude?: number; longitude?: number; updatedAt?: string } | null;
};

export async function GET() {
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const orders = await findMongoDocuments<StoredOrder>(
    'StoreOrder',
    { userId: session.user.id },
    100,
  );
  return NextResponse.json(
    {
      orders: orders.map((order) => ({
        orderNumber: order._id,
        status: order.status ?? 'payment_pending',
        paymentStatus: order.paymentStatus ?? 'pending',
        currency: order.currency ?? 'USD',
        subtotalCents: order.subtotalCents ?? 0,
        items: order.items ?? [],
        createdAt: order.createdAt ?? '',
        paidAt: order.paidAt ?? null,
        statusHistory: order.statusHistory ?? [],
        riderLocation: order.riderLocation ?? null,
      })),
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
