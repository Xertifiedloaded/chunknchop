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

    if (!data.paystackAuthorizationCode) {
      return NextResponse.json({ error: 'Missing Paystack authorization code' }, { status: 400 });
    }

    if (data.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await prisma.paymentMethod.upsert({
      where: { paystackAuthorizationCode: data.paystackAuthorizationCode },
      update: {
        isDefault: data.isDefault || false,
        isActive: true,
      },
      create: {
        userId: user.id,
        type: data.type ?? 'CARD',
        label: data.label,
        cardLast4: data.cardLast4,
        cardBrand: data.cardBrand,
        cardExpiry: data.cardExpiry,
        bankName: data.bankName,
        bankAccountLast4: data.bankAccountLast4,
        paystackAuthorizationCode: data.paystackAuthorizationCode,
        paystackCustomerCode: data.paystackCustomerCode,
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
