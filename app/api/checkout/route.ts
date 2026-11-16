import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
import {
  findMongoDocument,
  deleteMongoDocument,
  updateMongoDocument,
} from '@/lib/mongo-collections';
import {
  initializePaystackTransaction,
  isPaystackConfigured,
  PaystackConfigurationError,
  PAYSTACK_CURRENCY,
} from '@/lib/paystack';

const checkoutSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(7).max(32),
    addressLine1: z.string().trim().min(4).max(160),
    addressLine2: z.string().trim().max(160).optional().default(''),
    city: z.string().trim().min(2).max(80),
    region: z.string().trim().min(2).max(80),
    postalCode: z.string().trim().min(3).max(20),
    checkoutRequestId: z.string().uuid(),
  })
  .strict();

type StoredCart = { items?: Array<{ slug?: unknown; quantity?: unknown }> };

export async function POST(request: Request) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });

  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Sign in before placing an order' }, { status: 401 });
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: 'Paystack checkout is not configured. Add PAYSTACK_SECRET_KEY to enable payments.' },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Check the delivery details and try again' },
      { status: 400 },
    );

  const orderNumber = `CNC-${parsed.data.checkoutRequestId.replaceAll('-', '').toUpperCase()}`;
  const existingOrder = await findMongoDocument<{ userId?: string; authorizationUrl?: unknown }>(
    'StoreOrder',
    orderNumber,
  );
  if (existingOrder) {
    if (existingOrder.userId !== session.user.id)
      return NextResponse.json(
        { error: 'This checkout reference is already in use' },
        { status: 409 },
      );
    if (typeof existingOrder.authorizationUrl === 'string') {
      return NextResponse.json(
        { orderNumber, authorizationUrl: existingOrder.authorizationUrl },
        { status: 200 },
      );
    }
    return NextResponse.json(
      { error: 'This checkout is still being prepared. Try again shortly.' },
      { status: 409 },
    );
  }

  const cart = await findMongoDocument<StoredCart>('UserCart', session.user.id);
  const cartItems = (cart?.items ?? []).filter(
    (item): item is { slug: string; quantity: number } =>
      typeof item.slug === 'string' &&
      Number.isInteger(item.quantity) &&
      Number(item.quantity) >= 1 &&
      Number(item.quantity) <= 99,
  );
  if (!cartItems.length)
    return NextResponse.json({ error: 'Your saved bag is empty' }, { status: 409 });

  const slugs = [...new Set(cartItems.map((item) => item.slug))];
  if (slugs.length !== cartItems.length)
    return NextResponse.json(
      { error: 'Your bag needs an update before checkout' },
      { status: 409 },
    );

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, published: true },
  });
  if (products.length !== slugs.length) {
    return NextResponse.json(
      { error: 'One or more products are no longer available' },
      { status: 409 },
    );
  }

  const productsBySlug = new Map(products.map((product) => [product.slug, product]));
  const orderItems = cartItems.map((item) => {
    const product = productsBySlug.get(item.slug)!;
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unit: product.unit,
      priceCents: product.priceCents, 
      quantity: item.quantity,
    };
  });
  const subtotalCents = orderItems.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0,
  );
  const createdAt = new Date().toISOString();
  const paymentReference = orderNumber;

  await prisma.$runCommandRaw({
    insert: 'StoreOrder',
    documents: [
      {
        _id: orderNumber,
        userId: session.user.id,
        email: session.user.email,
        customerName: parsed.data.fullName,
        delivery: parsed.data,
        items: orderItems,
        subtotalCents,
        currency: PAYSTACK_CURRENCY,
        checkoutRequestId: parsed.data.checkoutRequestId,
        paymentReference,
        status: 'payment_pending',
        paymentStatus: 'pending',
        statusHistory: [
          {
            status: 'payment_pending',
            at: createdAt,
            note: 'Order created; awaiting Paystack payment',
          },
        ],
        createdAt,
      },
    ],
    ordered: true,
  });

  try {
    const callbackUrl = new URL(
      `/api/payments/paystack/callback?order=${encodeURIComponent(orderNumber)}`,
      new URL(request.url).origin,
    ).toString();
    const checkout = await initializePaystackTransaction({
      email: session.user.email,
      amountCents: subtotalCents,
      reference: paymentReference,
      orderNumber,
      callbackUrl,
    });
    await updateMongoDocument(
      'StoreOrder',
      { _id: orderNumber, userId: session.user.id },
      {
        $set: { authorizationUrl: checkout.authorizationUrl },
      },
    );
    return NextResponse.json(
      { orderNumber, authorizationUrl: checkout.authorizationUrl },
      { status: 201 },
    );
  } catch (error) {
    console.error('[checkout] Paystack initialization failed:', error);
    await deleteMongoDocument('StoreOrder', orderNumber).catch(() => undefined);
    if (error instanceof PaystackConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Paystack checkout could not be started' },
      { status: 502 },
    );
  }
}