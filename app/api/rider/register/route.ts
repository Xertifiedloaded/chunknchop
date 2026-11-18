import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
const schema = z
  .object({
    phone: z.string().trim().min(7).max(32),
    photoUrl: z.string().url().optional(),
    residentialAddress: z.string().trim().min(5).max(250),
    vehicleType: z.enum(['motorcycle', 'car', 'van', 'other']),
    vehicleBrand: z.string().trim().max(80).optional(),
    vehicleModel: z.string().trim().max(80).optional(),
    vehicleColor: z.string().trim().min(2).max(40),
    plateNumber: z.string().trim().min(3).max(30),
    licenseNumber: z.string().trim().max(60).optional(),
    licenseImageUrl: z.string().url().optional(),
    zoneIds: z
      .array(z.string().regex(/^[a-f\d]{24}$/i))
      .min(1)
      .max(20),
  })
  .strict();
export async function POST(req: Request) {
  if (!hasSameOrigin(req))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const s = await getSession(await headers());
  if (!s?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (s.user.role !== 'rider')
    return NextResponse.json(
      {
        error:
          'Only accounts with the rider role can register rider details. Contact an administrator to enable rider access.',
      },
      { status: 403 },
    );
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: 'Check your rider and vehicle information', issues: p.error.flatten() },
      { status: 400 },
    );
  const zones = await prisma.deliveryZone.findMany({
    where: { id: { in: p.data.zoneIds }, active: true },
    select: { id: true },
  });
  if (zones.length !== new Set(p.data.zoneIds).size)
    return NextResponse.json(
      { error: 'One or more selected delivery zones are unavailable' },
      { status: 400 },
    );
  const { zoneIds, ...profile } = p.data;
  const riderProfile = await prisma.riderProfile.upsert({
    where: { userId: s.user.id },
    create: {
      ...profile,
      userId: s.user.id,
      zones: { create: zoneIds.map((zoneId) => ({ zoneId })) },
    },
    update: {
      ...profile,
      verificationStatus: 'pending',
      isActive: false,
      isAvailable: false,
      zones: { deleteMany: {}, create: zoneIds.map((zoneId) => ({ zoneId })) },
    },
  });
  return NextResponse.json(
    { riderProfile, message: 'Your rider application has been submitted for admin review.' },
    { status: 201 },
  );
}
