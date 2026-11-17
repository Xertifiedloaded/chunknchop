import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { findMongoDocuments } from '@/lib/mongo-collections';

type Order = {
  _id: string;
  customerName?: string;
  email?: string;
  paymentStatus?: string;
  status?: string;
  subtotalCents?: number;
  currency?: string;
  paymentReference?: string;
  paymentTransactionId?: string | number;
  createdAt?: string;
  paidAt?: string;
};
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const access = await requireAdminApi();
  if (access.response) return access.response;
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();
  const status = (url.searchParams.get('status') ?? 'all').toLowerCase();
  const range = url.searchParams.get('range') ?? '30';
  const days = range === 'all' ? null : Math.min(3650, Math.max(1, Number(range) || 30));
  const orders = await findMongoDocuments<Order>('StoreOrder', {}, 2000, { createdAt: -1 });
  const now = Date.now();
  const filtered = orders.filter((order) => {
    const text =
      `${order._id} ${order.customerName ?? ''} ${order.email ?? ''} ${order.paymentReference ?? ''}`.toLowerCase();
    const date = order.paidAt ?? order.createdAt;
    const withinRange = days === null || !date || now - Date.parse(date) <= days * 86400000;
    return (
      (!query || text.includes(query)) &&
      (status === 'all' || (order.paymentStatus ?? 'pending').toLowerCase() === status) &&
      withinRange
    );
  });
  const paid = filtered.filter((order) => order.paymentStatus === 'paid');
  const failed = filtered.filter((order) => order.paymentStatus === 'failed');
  const pending = filtered.filter(
    (order) => !['paid', 'failed'].includes(order.paymentStatus ?? ''),
  );
  const revenueCents = paid.reduce((sum, order) => sum + (Number(order.subtotalCents) || 0), 0);
  const byDay = new Map<string, { revenueCents: number; count: number }>();
  for (const order of paid) {
    const date = (order.paidAt ?? order.createdAt ?? '').slice(0, 10);
    if (!date) continue;
    const row = byDay.get(date) ?? { revenueCents: 0, count: 0 };
    row.revenueCents += Number(order.subtotalCents) || 0;
    row.count += 1;
    byDay.set(date, row);
  }
  const daily = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, row]) => ({ date, ...row }));
  return NextResponse.json(
    {
      analytics: {
        revenueCents,
        paidCount: paid.length,
        failedCount: failed.length,
        pendingCount: pending.length,
        totalCount: filtered.length,
        averagePaymentCents: paid.length ? Math.round(revenueCents / paid.length) : 0,
        successRate: filtered.length ? Math.round((paid.length / filtered.length) * 1000) / 10 : 0,
        daily,
      },
      payments: filtered.map(({ _id, paymentReference: _reference, ...order }) => ({
        id: _id,
        orderNumber: _id,
        ...order,
        paymentReference: _reference ?? null,
      })),
    },
    { headers },
  );
}
