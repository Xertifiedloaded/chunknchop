import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decorateSchedule } from '@/lib/delivery-schedules';

export const dynamic = 'force-dynamic';

const objectId = /^[a-f\d]{24}$/i;
const noStore = { headers: { 'Cache-Control': 'private, no-store' } };
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
        ...decorateSchedule(row),
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
    latitude: zone.latitude,
    longitude: zone.longitude,
    radiusMeters: zone.radiusMeters,
  }));

  return NextResponse.json({ zones }, noStore);
}