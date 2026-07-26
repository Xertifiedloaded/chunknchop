import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';
import stripe from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry } =
      body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const cartItemId of items) {
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: { product: { include: { tiers: true } } },
      });

      if (!cartItem) {
        return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
      }

      // Verify stock
      if (cartItem.product.stock < cartItem.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for ${cartItem.product.name}` },
          { status: 400 }
        );
      }

      const tierPrice = cartItem.selectedTier
        ? cartItem.product.tiers.find((t) => t.name === cartItem.selectedTier)?.price
        : undefined;
      const itemPrice = tierPrice || cartItem.product.basePrice;
      const itemTotal = itemPrice * cartItem.quantity;

      subtotal += itemTotal;
      orderItems.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        pricePerUnit: itemPrice,
        tier: cartItem.selectedTier,
        variants: cartItem.selectedVariants,
      });
    }

    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shipping;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: user.id,
      },
    });

    // Create order in database
    const order = await prisma.order.create({
      data: {
        customerId: user.id,
        subtotal,
        tax,
        shipping,
        total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentIntentId: paymentIntent.id,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingZip,
        shippingCountry,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    return NextResponse.json({
      order,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('[v0] Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: user.id },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('[v0] Get orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
