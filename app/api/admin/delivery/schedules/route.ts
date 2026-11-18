import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminApi, hasSameOrigin } from '@/lib/admin-api';

const schema = z
  .object({
    zoneId: z.string().regex(/^[a-f\d]{24}$/i),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    capacity: z.number().int().min(1).max(500).default(10),
    active: z.boolean().default(true),
  })
  .strict();

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const schedules = await prisma.deliverySchedule.findMany({
    include: { zone: { select: { id: true, name: true, city: true, state: true } } },
    orderBy: { startsAt: 'desc' },
    take: 250,
  });
  return NextResponse.json({ schedules });
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Enter a valid zone, date, time and capacity' },
      { status: 400 },
    );
  const data = parsed.data;
  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(data.endsAt);
  if (startsAt <= new Date() || endsAt <= startsAt)
    return NextResponse.json(
      { error: 'Schedule must be in the future and end after it starts' },
      { status: 400 },
    );
  const zone = await prisma.deliveryZone.findFirst({ where: { id: data.zoneId, active: true } });
  if (!zone) return NextResponse.json({ error: 'Select an active delivery zone' }, { status: 404 });
  const overlap = await prisma.deliverySchedule.findFirst({
    where: {
      zoneId: data.zoneId,
      active: true,
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (overlap)
    return NextResponse.json(
      { error: 'This schedule overlaps another active slot for the selected zone' },
      { status: 409 },
    );
  const schedule = await prisma.deliverySchedule.create({ data: { ...data, startsAt, endsAt } });
  return NextResponse.json({ schedule }, { status: 201 });
}
