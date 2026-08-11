import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';

// GET /api/admin/riders — list riders with their current active-delivery count
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const riders = await prisma.rider.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { orders: { where: { status: 'OUT_FOR_DELIVERY' } } },
        },
      },
    });

    const formatted = riders.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      email: r.email,
      vehicleType: r.vehicleType,
      licensePlate: r.licensePlate,
      status: r.status,
      isActive: r.isActive,
      rating: r.rating,
      totalDeliveries: r.totalDeliveries,
      activeDeliveries: r._count.orders,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching riders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/riders — add a new rider
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, email, vehicleType, licensePlate } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'name and phone are required' }, { status: 400 });
    }

    const rider = await prisma.rider.create({
      data: { name, phone, email, vehicleType, licensePlate },
    });

    return NextResponse.json(rider, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A rider with that phone or email already exists' }, { status: 409 });
    }
    console.error('Error creating rider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
