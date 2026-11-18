import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminApi, hasSameOrigin } from '@/lib/admin-api';

type Context = { params: Promise<{ id: string }> };
const patchSchema = z
  .object({
    active: z.boolean().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    capacity: z.number().int().min(1).max(500).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Provide a field to update');

export async function PATCH(request: Request, { params }: Context) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid schedule update' }, { status: 400 });
  const existing = await prisma.deliverySchedule.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  const startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : existing.startsAt;
  const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : existing.endsAt;
  const capacity = parsed.data.capacity ?? existing.capacity;
  if (startsAt <= new Date() || endsAt <= startsAt)
    return NextResponse.json(
      { error: 'Schedule must be in the future and end after it starts' },
      { status: 400 },
    );
  if (capacity < existing.bookedCount)
    return NextResponse.json(
      { error: 'Capacity cannot be lower than the number of existing bookings' },
      { status: 409 },
    );
  if (parsed.data.startsAt || parsed.data.endsAt) {
    const overlap = await prisma.deliverySchedule.findFirst({
      where: {
        id: { not: id },
        zoneId: existing.zoneId,
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
  }
  const schedule = await prisma.deliverySchedule.update({
    where: { id },
    data: { ...parsed.data, startsAt, endsAt },
  });
  return NextResponse.json({ schedule });
}

export async function DELETE(request: Request, { params }: Context) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const { id } = await params;
  const slot = await prisma.deliverySchedule.findUnique({ where: { id } });
  if (!slot) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  if (slot.bookedCount > 0)
    return NextResponse.json(
      { error: 'A schedule with bookings cannot be deleted. Deactivate it instead.' },
      { status: 409 },
    );
  await prisma.deliverySchedule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
