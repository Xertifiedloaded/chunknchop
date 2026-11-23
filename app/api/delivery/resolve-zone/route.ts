import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveDeliveryZone } from '@/lib/delivery-zone';
const schema = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), zoneId: z.string().regex(/^[a-f\d]{24}$/i).optional() });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Valid coordinates are required.' }, { status: 400 });
  const zone = await resolveDeliveryZone(parsed.data, parsed.data.zoneId);
  return NextResponse.json({ zone: zone ? { id: zone.id, name: zone.name, city: zone.city, state: zone.state, deliveryFeeCents: zone.deliveryFeeCents, latitude: zone.latitude, longitude: zone.longitude, radiusMeters: zone.radiusMeters } : null }, { headers: { 'Cache-Control': 'private, no-store' } });
}
