import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { requireAdminApi, hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
import { findMongoDocuments } from '@/lib/mongo-collections';
type Order = {
  _id: string;
  riderId?: string;
  status?: string;
  deliveryFeeCents?: number;
  deliveredAt?: string;
  statusUpdatedAt?: string;
  createdAt?: string;
};
type Payout = {
  _id: string;
  riderId: string;
  amountCents: number;
  reference: string;
  note?: string;
  paidAt: string;
  paidBy: string;
  createdAt: string;
};
export async function GET(req: Request) {
  const a = await requireAdminApi();
  if (a.response) return a.response;
  const month = new URL(req.url).searchParams.get('month');
  if (month && !/^\d{4}-\d{2}$/.test(month))
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
  const [riders, payouts, orders] = await Promise.all([
    prisma.riderProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    findMongoDocuments<Payout>('RiderPayout', {}, 2000, { paidAt: -1 }),
    findMongoDocuments<Order>('StoreOrder', { status: 'delivered' }, 5000, { statusUpdatedAt: -1 }),
  ]);
  const deliveries = orders
    .filter((o) => {
      const d = new Date(o.deliveredAt ?? o.statusUpdatedAt ?? o.createdAt ?? 0);
      const key = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Lagos',
        year: 'numeric',
        month: '2-digit',
      }).format(d);
      return !month || key === month;
    })
    .map((o) => ({
      orderNumber: o._id,
      riderId: o.riderId ?? '',
      amountCents: Math.max(0, o.deliveryFeeCents ?? 0),
      deliveredAt: o.deliveredAt ?? o.statusUpdatedAt ?? o.createdAt ?? null,
    }));
  const result = riders.map((r) => {
    const delivered = orders.filter((o) => o.riderId === r.userId);
    const earned = delivered.reduce((n, o) => n + Math.max(0, o.deliveryFeeCents ?? 0), 0);
    const paid = payouts
      .filter((p) => p.riderId === r.userId)
      .reduce((n, p) => n + p.amountCents, 0);
    return {
      riderId: r.userId,
      profileId: r.id,
      name: r.user.name,
      email: r.user.email,
      bankAccountName: r.bankAccountName ?? '',
      bankName: r.bankName ?? '',
      bankAccountNumber: r.bankAccountNumber ?? '',
      earnedCents: earned,
      paidCents: paid,
      unpaidCents: Math.max(0, earned - paid),
      deliveryCount: delivered.length,
    };
  });
  return NextResponse.json(
    { riders: result, payouts, deliveries },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
const body = z
  .object({
    riderId: z.string().min(1),
    amountCents: z.number().int().positive(),
    reference: z.string().trim().min(2).max(120),
    note: z.string().max(500).optional(),
  })
  .strict();
export async function POST(req: Request) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const a = await requireAdminApi();
  if (a.response) return a.response;
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid payout' },
      { status: 400 },
    );
  const { riderId, amountCents, reference, note } = parsed.data;
  const profile = await prisma.riderProfile.findUnique({
    where: { userId: riderId },
    select: { userId: true, bankAccountName: true, bankName: true, bankAccountNumber: true },
  });
  if (!profile) return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
  if (!profile.bankAccountName || !profile.bankName || !profile.bankAccountNumber)
    return NextResponse.json(
      { error: 'Rider has not saved complete bank details' },
      { status: 409 },
    );
  const [orders, payouts] = await Promise.all([
    findMongoDocuments<Order>('StoreOrder', { riderId, status: 'delivered' }, 5000, {
      statusUpdatedAt: -1,
    }),
    findMongoDocuments<Payout>('RiderPayout', { riderId }, 2000, { paidAt: -1 }),
  ]);
  const earned = orders.reduce((n, o) => n + Math.max(0, o.deliveryFeeCents ?? 0), 0);
  const paid = payouts.reduce((n, p) => n + p.amountCents, 0);
  const unpaid = Math.max(0, earned - paid);
  if (amountCents > unpaid)
    return NextResponse.json(
      { error: `Amount exceeds unpaid earnings (${unpaid} kobo)` },
      { status: 409 },
    );
  const now = new Date().toISOString();
  const payout: Payout = {
    _id: randomUUID(),
    riderId,
    amountCents,
    reference,
    note,
    paidAt: now,
    paidBy: a.user?.id ?? 'admin',
    createdAt: now,
  };
  await prisma.$runCommandRaw({ insert: 'RiderPayout', documents: [payout] });
  return NextResponse.json({ payout }, { status: 201 });
}
