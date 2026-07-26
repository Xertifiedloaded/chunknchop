import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const methods = await prisma.paymentMethod.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: 'desc' },
    });

    return NextResponse.json(methods);
  } catch (error) {
    console.error('Payment methods error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (data.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        userId: user.id,
        type: data.type,
        label: data.label,
        cardLast4: data.cardNumber?.slice(-4),
        cardBrand: data.cardBrand,
        cardExpiry: data.cardExpiry,
        isDefault: data.isDefault || false,
        isActive: true,
      },
    });

    return NextResponse.json(paymentMethod);
  } catch (error) {
    console.error('Payment method create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
