import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(promotions);
  } catch (error) {
    console.error('Promotions error:', error);
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

    const promotion = await prisma.promotion.create({
      data: {
        code: data.code,
        description: data.description,
        type: data.type,
        value: data.value,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        maxUses: data.maxUses,
        minOrderAmount: data.minOrderAmount,
        applicableProducts: [],
        applicableMeatTypes: [],
        isActive: data.isActive,
      },
    });

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Promotion create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
