import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const schema = z.object({ phone: z.string().min(6) });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';

// POST /api/rider/login — simple phone-based login for riders
// For production use add OTP or password. This endpoint returns an accessToken
// with payload { id: riderId, role: 'RIDER' } which is understood by pusher auth.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = schema.parse(body);

    const rider = await prisma.rider.findUnique({ where: { phone } });
    if (!rider) return NextResponse.json({ error: 'Rider not found' }, { status: 404 });

    const payload = { id: rider.id, role: 'RIDER', rider: true };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return NextResponse.json({ rider: { id: rider.id, name: rider.name, phone: rider.phone }, accessToken });
  } catch (error) {
    console.error('Rider login error:', error);
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
