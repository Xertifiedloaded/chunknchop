import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decorateSchedule } from '@/lib/delivery-schedules';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const zoneId = url.searchParams.get('zoneId');
  if (!zoneId || !/^[a-f\d]{24}$/i.test(zoneId)) {
    return NextResponse.json({ error: 'Choose a valid delivery zone' }, { status: 400 });
  }

  const now = new Date();
  const slots = await prisma.deliverySchedule.findMany({
    where: {
      zoneId,
      active: true,
      startsAt: { gt: now },
    },
    orderBy: { startsAt: 'asc' },
    take: 100,
  });

  return NextResponse.json(
    { slots: slots.filter((slot) => slot.bookedCount < slot.capacity).map(decorateSchedule) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
