import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { findMongoDocuments } from '@/lib/mongo-collections';

type Order = {
  _id: string;
  status?: string;
  deliveryFeeCents?: number;
  deliveredAt?: string;
  statusUpdatedAt?: string;
  createdAt?: string;
  delivery?: { deliveryDate?: string | null; deliveryWindow?: string | null };
};
const money = (n: number) => Math.max(0, Math.round(n || 0));
const dateOf = (o: Order) => new Date(o.deliveredAt ?? o.statusUpdatedAt ?? o.createdAt ?? 0);
const nairaMonth = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
  }).format(d);
export async function GET(req: Request) {
  const s = await getSession(await headers());
  if (!s?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (s.user.role !== 'rider')
    return NextResponse.json({ error: 'Rider access required' }, { status: 403 });
  const month = new URL(req.url).searchParams.get('month');
  if (month && !/^\d{4}-\d{2}$/.test(month))
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
  const orders = await findMongoDocuments<Order>('StoreOrder', { riderId: s.user.id }, 2000, {
    statusUpdatedAt: -1,
  });
  const completed = orders
    .filter((o) => o.status === 'delivered')
    .map((o) => ({ ...o, earnedCents: money(o.deliveryFeeCents ?? 0), earnedAt: dateOf(o) }));
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const lagosParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => Number(lagosParts.find((p) => p.type === type)?.value ?? 0);
  const lagosMidnightUtc = Date.UTC(part('year'), part('month') - 1, part('day'));
  const daysSinceMonday = (new Date(lagosMidnightUtc).getUTCDay() + 6) % 7;
  const weekStart = new Date(lagosMidnightUtc - daysSinceMonday * 86400000 - 3600000);
  const total = (items: typeof completed) => items.reduce((n, o) => n + o.earnedCents, 0);
  const selected = month ? completed.filter((o) => nairaMonth(o.earnedAt) === month) : completed;
  const history = selected
    .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime())
    .map((o) => ({
      orderNumber: o._id,
      amountCents: o.earnedCents,
      deliveredAt: o.earnedAt.toISOString(),
      deliveryDate: o.delivery?.deliveryDate ?? null,
      deliveryWindow: o.delivery?.deliveryWindow ?? null,
    }));
  return NextResponse.json(
    {
      summary: {
        todayCents: total(
          completed.filter(
            (o) =>
              new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Africa/Lagos',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              }).format(o.earnedAt) === today,
          ),
        ),
        weekCents: total(completed.filter((o) => o.earnedAt >= weekStart)),
        monthCents: total(completed.filter((o) => nairaMonth(o.earnedAt) === nairaMonth(now))),
        lifetimeCents: total(completed),
      },
      history,
      selectedMonth: month ?? null,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
