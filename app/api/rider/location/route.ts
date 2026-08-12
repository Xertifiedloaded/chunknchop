import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { pusher } from '@/lib/pusher';
import { z } from 'zod';

const schema = z.object({
  riderId: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  bearing: z.number().optional(),
  speed: z.number().optional(),
});

// POST /api/rider/location — accepts location updates from rider devices and
// broadcasts them via Pusher. Does NOT persist to DB (keeps schema changes minimal).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { riderId, latitude, longitude, bearing, speed } = schema.parse(body);

    const rider = await prisma.rider.findUnique({ where: { id: riderId } });
    if (!rider) return NextResponse.json({ error: 'Rider not found' }, { status: 404 });

    const payload = {
      riderId,
      latitude,
      longitude,
      bearing: bearing ?? null,
      speed: speed ?? null,
      timestamp: new Date().toISOString(),
    };

    // Broadcast updated rider location to rider-specific and admin channels
    await pusher.trigger(`private-rider-${riderId}`, 'location-update', payload);
    await pusher.trigger('private-admin-riders', 'rider-location', payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rider location error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
