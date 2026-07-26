import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { customerId: user.id },
      include: {
        productTier: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productTierId, frequency } = await request.json();

    if (!productTierId || !frequency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate frequency
    if (!['WEEKLY', 'BIWEEKLY', 'MONTHLY'].includes(frequency)) {
      return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
    }

    // Get product tier details
    const productTier = await prisma.productTier.findUnique({
      where: { id: productTierId },
      include: {
        product: true,
      },
    });

    if (!productTier) {
      return NextResponse.json({ error: 'Product tier not found' }, { status: 404 });
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        customerId: user.id,
        productTierId,
        frequency,
        status: 'ACTIVE',
        nextDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      include: {
        productTier: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
