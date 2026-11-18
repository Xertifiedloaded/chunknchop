import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const schema = z
  .object({
    label: z.string().trim().min(1).max(30),
    fullName: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(7).max(32),
    addressLine1: z.string().trim().min(4).max(160),
    addressLine2: z.string().trim().max(160).optional(),
    area: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    postalCode: z.string().trim().max(20).optional(),
    instructions: z.string().trim().max(500).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    isDefault: z.boolean().default(false),
  })
  .strict();

export async function GET() {
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const addresses = await prisma.customerAddress.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ addresses }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Check the address details', issues: parsed.error.flatten() },
      { status: 400 },
    );
  const data = parsed.data;
  const result = await prisma.$transaction(async (tx) => {
    if (data.isDefault)
      await tx.customerAddress.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    const count = await tx.customerAddress.count({ where: { userId: session.user.id } });
    return tx.customerAddress.create({
      data: { ...data, isDefault: data.isDefault || count === 0, userId: session.user.id },
    });
  });
  return NextResponse.json({ address: result }, { status: 201 });
}
