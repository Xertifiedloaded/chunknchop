import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';
import { paystack } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items, shippingAddress, shippingCity, shippingState, shippingZip, shippingCountry } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    if (!shippingAddress || !shippingCity || !shippingState || !shippingZip || !shippingCountry) {
      return NextResponse.json({ error: 'Missing shipping details' }, { status: 400 });
    }

    // `items` from the client is an array of cart item IDs (strings)
    const cartItemIds: string[] = items;

    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItems = [];

      for (const cartItemId of cartItemIds) {
        const cartItem = await tx.cartItem.findFirst({
          where: { id: cartItemId, userId: user.id },
          include: { product: { include: { tiers: true } } },
        });

        if (!cartItem) {
          throw new Error('Cart item not found');
        }

        const updateResult = await tx.product.updateMany({
          where: { id: cartItem.productId, stock: { gte: cartItem.quantity } },
          data: { stock: { decrement: cartItem.quantity } },
        });

        if (updateResult.count === 0) {
          throw new Error(`Not enough stock for ${cartItem.product.name}`);
        }

        const tierPrice = cartItem.selectedTier ? cartItem.product.tiers.find((t) => t.name === cartItem.selectedTier)?.price : undefined;
        const itemPrice = tierPrice ?? cartItem.product.basePrice;

        subtotal += itemPrice * cartItem.quantity;

        orderItems.push({
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          pricePerUnit: itemPrice,
          tier: cartItem.selectedTier,
          variants: cartItem.selectedVariants,
        });
      }

      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const shipping = subtotal > 100 ? 0 : 10;
      const total = subtotal + tax + shipping;

      const createdOrder = await tx.order.create({
        data: {
          customerId: user.id,
          subtotal,
          tax,
          shipping,
          total,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          shippingAddress,
          shippingCity,
          shippingState,
          shippingZip,
          shippingCountry,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({
        where: { id: { in: cartItemIds }, userId: user.id },
      });

      return createdOrder;
    });

    const reference = `order_${order.id}`;
    const currency = 'NGN';
    const amountInSubunit = Math.round(order.total * 100); // kobo

    try {
      const init = await paystack.initializeTransaction({
        email: user.email,
        amount: amountInSubunit,
        currency,
        reference,
        callback_url: `${process.env.APP_URL}/checkout/callback`,
        metadata: { orderId: order.id, userId: user.id },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paystackReference: reference },
      });

      return NextResponse.json({
        order,
        authorizationUrl: init.data.authorization_url,
        reference,
      });
    } catch (paystackError) {
      console.error(' Paystack init error:', paystackError);

      await prisma.$transaction(async (tx) => {
        const cancelledOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
          include: { items: true },
        });

        for (const item of cancelledOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });

      throw new Error('Failed to initialize payment. Please try again.');
    }
  } catch (error) {
    console.error(' Checkout error:', error);

    const message = error instanceof Error ? error.message : 'Failed to create order';
    const isClientError = message.includes('stock') || message.includes('not found') || message.includes('Missing');
    const status = isClientError ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
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

    return NextResponse.json({ orders: orders ?? [] }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/customer/orders]', error);

    return NextResponse.json({ error: 'Failed to fetch orders', orders: [] }, { status: 500 });
  }
}
