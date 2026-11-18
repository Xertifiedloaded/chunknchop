import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const objectId = /^[a-f\d]{24}$/i;
const TIME_ZONE = 'Africa/Lagos';

const noStore = { headers: { 'Cache-Control': 'private, no-store' } };

 
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TIME_ZONE,
  });
}


function stripState(value: string) {
  return value.replace(/\s+state$/i, '').trim();
}





export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const zoneId = searchParams.get('zoneId')?.trim();

  if (zoneId) {
    if (!objectId.test(zoneId)) {
      return NextResponse.json({ error: 'Invalid delivery area' }, { status: 400 });
    }

    const rows = await prisma.deliverySchedule.findMany({
      where: {
        zoneId,
        active: true,
        startsAt: { gt: new Date() },
      },
      orderBy: { startsAt: 'asc' },
      take: 100,
    });

    const schedules = rows
       
      .filter((row) => row.bookedCount < row.capacity)
      .map((row) => ({
        id: row.id,
        date: dateFormatter.format(row.startsAt),
        startTime: formatTime(row.startsAt),
        endTime: formatTime(row.endsAt),
        available: true,
        remainingCapacity: row.capacity - row.bookedCount,
      }));

    return NextResponse.json({ schedules }, noStore);
  }

  const city = searchParams.get('city')?.trim();
  const state = searchParams.get('state')?.trim();

   
  const rows = await prisma.deliveryZone.findMany({
    where: {
      active: true,
      ...(city ? { city: { equals: city, mode: 'insensitive' as const } } : {}),
      ...(state
        ? { state: { contains: stripState(state), mode: 'insensitive' as const } }
        : {}),
    },
    orderBy: [{ state: 'asc' }, { city: 'asc' }, { name: 'asc' }],
  });

  const zones = rows.map((zone) => ({
    id: zone.id,
    name: zone.name,
    city: zone.city,
    state: zone.state,
    deliveryFeeCents: zone.deliveryFeeCents,
    active: zone.active,
  }));

  return NextResponse.json({ zones }, noStore);
}