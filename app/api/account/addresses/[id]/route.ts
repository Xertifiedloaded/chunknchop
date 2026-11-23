import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
import { resolveDeliveryZone } from '@/lib/delivery-zone';

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
    deliveryZoneId: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),

    isDefault: z.boolean().optional(),
  })
  .strict();

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });

  const s = await getSession(await headers());
  if (!s?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;

  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: 'Invalid address details', issues: p.error.flatten() },
      { status: 400 },
    );

  const exists = await prisma.customerAddress.findFirst({ where: { id, userId: s.user.id } });
  if (!exists) return NextResponse.json({ error: 'Address not found' }, { status: 404 });
  const selectedZone = await resolveDeliveryZone(p.data, p.data.deliveryZoneId);
  if (p.data.deliveryZoneId && !selectedZone)
    return NextResponse.json({ error: 'Selected delivery zone is unavailable.' }, { status: 400 });
  if (p.data.latitude != null && p.data.longitude != null && !selectedZone)
    return NextResponse.json({ error: 'This pinned location is outside active delivery zones.' }, { status: 400 });
  if (selectedZone) p.data.deliveryZoneId = selectedZone.id;

  const address = await prisma.$transaction(async (tx) => {
    if (p.data.isDefault)
      await tx.customerAddress.updateMany({
        where: { userId: s.user.id, id: { not: id } },
        data: { isDefault: false },
      });

    return tx.customerAddress.update({ where: { id }, data: { ...p.data, ...(selectedZone ? { area: selectedZone.name, city: selectedZone.city, state: selectedZone.state, ...(selectedZone.latitude != null ? { latitude: selectedZone.latitude } : {}), ...(selectedZone.longitude != null ? { longitude: selectedZone.longitude } : {}) } : {}) } });
  });

  return NextResponse.json({ address });
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });

  const s = await getSession(await headers());
  if (!s?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;

  const result = await prisma.customerAddress.deleteMany({ where: { id, userId: s.user.id } });
  if (!result.count) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
