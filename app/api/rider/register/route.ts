import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email().optional(),
  vehicleType: z.string().optional(),
  licensePlate: z.string().optional(),
});

// Public endpoint for riders to register themselves (creates Rider record)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, vehicleType, licensePlate } = schema.parse(body);

    // ensure unique phone
    const existing = await prisma.rider.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: 'Rider with that phone already exists' }, { status: 409 });
    }

    const rider = await prisma.rider.create({
      data: { name, phone, email: email ?? null, vehicleType: vehicleType ?? null, licensePlate: licensePlate ?? null },
    });

    return NextResponse.json({ rider }, { status: 201 });
  } catch (error) {
    console.error('Rider register error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
