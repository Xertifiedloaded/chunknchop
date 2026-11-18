import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
const schema = z
  .object({
    accountName: z.string().trim().min(2).max(100),
    bankName: z.string().trim().min(2).max(100),
    accountNumber: z.string().regex(/^\d{10}$/, 'Account number must contain 10 digits'),
  })
  .strict();
export async function GET() {
  const s = await getSession(await headers());
  if (!s?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (s.user.role !== 'rider')
    return NextResponse.json({ error: 'Rider access required' }, { status: 403 });
  const p = await prisma.riderProfile.findUnique({
    where: { userId: s.user.id },
    select: { bankAccountName: true, bankName: true, bankAccountNumber: true },
  });
  return NextResponse.json(
    {
      bankDetails: p
        ? {
            accountName: p.bankAccountName ?? '',
            bankName: p.bankName ?? '',
            accountNumber: p.bankAccountNumber ?? '',
          }
        : null,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
export async function PUT(req: Request) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const s = await getSession(await headers());
  if (!s?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (s.user.role !== 'rider')
    return NextResponse.json({ error: 'Rider access required' }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid bank details' },
      { status: 400 },
    );
  await prisma.riderProfile.update({
    where: { userId: s.user.id },
    data: {
      bankAccountName: parsed.data.accountName,
      bankName: parsed.data.bankName,
      bankAccountNumber: parsed.data.accountNumber,
    },
  });
  return NextResponse.json({ ok: true });
}
