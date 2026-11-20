import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminApi, hasSameOrigin } from '@/lib/admin-api';
const schema = z
  .object({
    name: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(80),
    deliveryFeeCents: z.number().int().min(0).max(100000000),
    active: z.boolean().default(true),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    radiusMeters: z.number().int().min(100).max(50000).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.latitude !== undefined &&
      data.longitude !== undefined &&
      data.radiusMeters !== undefined,
    { message: 'Choose a zone location on the map', path: ['latitude'] },
  );
export async function GET() {
  const a = await requireAdminApi();
  if (a.response) return a.response;
  const zones = await prisma.deliveryZone.findMany({
    include: { _count: { select: { riders: true } } },
    orderBy: [{ state: 'asc' }, { city: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json({ zones });
}
export async function POST(req: Request) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const a = await requireAdminApi();
  if (a.response) return a.response;
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: 'Invalid delivery zone', issues: p.error.flatten() },
      { status: 400 },
    );
  try {
    return NextResponse.json(
      { zone: await prisma.deliveryZone.create({ data: p.data }) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: 'A zone with this name, city and state already exists' },
      { status: 409 },
    );
  }
}
