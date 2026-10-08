import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const zones = await prisma.deliveryZone.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(zones);
  } catch (error) {
    console.error('Delivery zones error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const zone = await prisma.deliveryZone.create({
      data: {
        name: data.name,
        state: data.state,
        zipCodes: data.zipCodes,
        baseCost: data.baseCost,
        freeDeliveryOver: data.freeDeliveryOver,
        estimatedDays: data.estimatedDays,
        isActive: data.isActive,
      },
    });

    return NextResponse.json(zone);
  } catch (error) {
    console.error('Delivery zone create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
