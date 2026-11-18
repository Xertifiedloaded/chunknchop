import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminApi, hasSameOrigin } from '@/lib/admin-api';
type Ctx = { params: Promise<{ id: string }> };
const schema = z
  .object({
    name: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(80),
    deliveryFeeCents: z.number().int().min(0).max(100000000),
    active: z.boolean(),
  })
  .strict();
export async function PATCH(req: Request, { params }: Ctx) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const a = await requireAdminApi();
  if (a.response) return a.response;
  const { id } = await params;
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: 'Invalid zone details' }, { status: 400 });
  try {
    return NextResponse.json({
      zone: await prisma.deliveryZone.update({ where: { id }, data: p.data }),
    });
  } catch {
    return NextResponse.json({ error: 'Zone not found or duplicate zone name' }, { status: 404 });
  }
}
export async function DELETE(req: Request, { params }: Ctx) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const a = await requireAdminApi();
  if (a.response) return a.response;
  const { id } = await params;
  const count = await prisma.riderZone.count({ where: { zoneId: id } });
  if (count)
    return NextResponse.json(
      { error: 'Remove this zone from assigned riders before deleting it' },
      { status: 409 },
    );
  try {
    await prisma.deliveryZone.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
  }
}
