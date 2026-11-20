import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const zones = await prisma.deliveryZone.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      deliveryFeeCents: true,
      latitude: true,
      longitude: true,
      radiusMeters: true,
    },
    orderBy: [{ city: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json({ zones }, { headers: { 'Cache-Control': 'public, max-age=30' } });
}
