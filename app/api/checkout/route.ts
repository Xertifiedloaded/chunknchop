import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
import { getEffectiveProductPrice } from '@/lib/products';
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

const deliveryMethods = ['home', 'pickup'] as const;

const timeSlots = [
  '8:00 AM – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 PM – 2:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
  '6:00 PM – 8:00 PM',
] as const;

const checkoutSchema = z
  .object({
    fullName: z.string().trim().max(100).default(''),
    phone: z.string().trim().max(32).default(''),
    addressLine1: z.string().trim().max(160).default(''),
    addressLine2: z.string().trim().max(160).default(''),
    city: z.string().trim().max(80).default(''),
    region: z.string().trim().max(80).default(''),
    postalCode: z.string().trim().max(20).default(''),

    deliveryMethod: z.enum(deliveryMethods).default('home'),
    deliveryDate: z.string().optional(),
    deliveryWindow: z.enum(timeSlots).optional(),
    deliveryNotes: z.string().trim().max(500).default(''),

    checkoutRequestId: z.string().uuid(),
    couponCode: z.string().trim().max(32).optional(),
  })
  .strict()
  .superRefine((data, context) => {
    if (data.deliveryMethod === 'home') {
      const requiredFields: Array<keyof typeof data> = [
        'fullName',
        'phone',
        'addressLine1',
        'city',
        'region',
        'postalCode',
      ];

      for (const field of requiredFields) {
        if (typeof data[field] !== 'string' || !data[field].trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: 'This field is required for home delivery',
          });
        }
      }

      if (data.fullName.length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fullName'],
          message: 'Enter a valid full name',
        });
      }

      if (data.phone.length < 7) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: 'Enter a valid phone number',
        });
      }

      if (data.addressLine1.length < 4) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['addressLine1'],
          message: 'Enter a valid delivery address',
        });
      }
    }

    if (data.deliveryDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.deliveryDate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['deliveryDate'],
        message: 'Invalid delivery date',
      });
    }
  });

type StoredCart = {
  items?: Array<{
    slug?: unknown;
    quantity?: unknown;
  }>;
};

const HOME_DELIVERY_FEE_CENTS = 950 * 100;

function getDeliveryFeeCents(method: 'home' | 'pickup', window?: (typeof timeSlots)[number]) {
  if (method === 'pickup') return 0;

  const slotFee = window === '4:00 PM – 6:00 PM' ? 250 : window === '6:00 PM – 8:00 PM' ? 400 : 0;

  return HOME_DELIVERY_FEE_CENTS + slotFee * 100;
}

function calculateCouponDiscount(
  coupon: {
    discountType: string;
    discountValue: number;
    maximumDiscountCents: number | null;
  },
  subtotalCents: number,
) {
  if (!Number.isInteger(coupon.discountValue) || coupon.discountValue <= 0) {
    return 0;
  }

  let discount = 0;

  if (coupon.discountType === 'PERCENTAGE') {
    if (coupon.discountValue > 100) return 0;

    discount = Math.round((subtotalCents * coupon.discountValue) / 100);
  } else if (coupon.discountType === 'FIXED') {
    discount = coupon.discountValue;
  } else {
    return 0;
  }

  if (coupon.maximumDiscountCents !== null) {
    discount = Math.min(discount, coupon.maximumDiscountCents);
  }

  return Math.max(0, Math.min(discount, subtotalCents));
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const session = await getSession(await headers());

  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in before placing an order' }, { status: 401 });
  }

  if (!isPaystackConfigured()) {
    return NextResponse.json(
      {
        error: 'Paystack checkout is not configured. Add PAYSTACK_SECRET_KEY to enable payments.',
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Check the delivery details and try again' },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const orderNumber = `CNC-${data.checkoutRequestId.replaceAll('-', '').toUpperCase()}`;

  const existingOrder = await findMongoDocument<{
    userId?: string;
    authorizationUrl?: unknown;
  }>('StoreOrder', orderNumber);

  if (existingOrder) {
    if (existingOrder.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'This checkout reference is already in use' },
        { status: 409 },
      );
    }

    if (typeof existingOrder.authorizationUrl === 'string') {
      return NextResponse.json(
        {
          orderNumber,
          authorizationUrl: existingOrder.authorizationUrl,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        error: 'This checkout is still being prepared. Try again shortly.',
      },
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

  if (!cartItems.length) {
    return NextResponse.json({ error: 'Your saved bag is empty' }, { status: 409 });
  }

  const slugs = [...new Set(cartItems.map((item) => item.slug))];

  if (slugs.length !== cartItems.length) {
    return NextResponse.json(
      { error: 'Your bag needs an update before checkout' },
      { status: 409 },
    );
  }

  const products = await prisma.product.findMany({
    where: {
      slug: { in: slugs },
      published: true,
    },
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
    const effectivePrice = getEffectiveProductPrice(product);

    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unit: product.unit,
      originalPriceCents: product.priceCents,
      priceCents: effectivePrice,
      productDiscountCents: product.priceCents - effectivePrice,
      imageUrl: product.imageUrl,
      category: product.category,
      quantity: item.quantity,
    };
  });

  const itemsSubtotalCents = orderItems.reduce(
    (total, item) => total + item.originalPriceCents * item.quantity,
    0,
  );

  const productDiscountCents = orderItems.reduce(
    (total, item) => total + item.productDiscountCents * item.quantity,
    0,
  );

  const discountedItemsTotalCents = itemsSubtotalCents - productDiscountCents;

  let couponId: string | null = null;
  let couponCode: string | null = null;
  let couponDiscountCents = 0;

  if (data.couponCode) {
    const normalizedCode = data.couponCode.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    const now = new Date();

    if (
      !coupon ||
      !coupon.active ||
      (coupon.startsAt && coupon.startsAt > now) ||
      (coupon.expiresAt && coupon.expiresAt < now) ||
      (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
    ) {
      return NextResponse.json(
        { error: 'This coupon is invalid, expired or unavailable' },
        { status: 400 },
      );
    }

    if (discountedItemsTotalCents < coupon.minimumOrderCents) {
      return NextResponse.json(
        { error: 'Your order does not meet this coupon minimum' },
        { status: 400 },
      );
    }

    couponDiscountCents = calculateCouponDiscount(coupon, discountedItemsTotalCents);

    if (couponDiscountCents <= 0) {
      return NextResponse.json(
        { error: 'This coupon does not provide a valid discount' },
        { status: 400 },
      );
    }

    couponId = coupon.id;
    couponCode = coupon.code;
  }

  const deliveryFeeCents = getDeliveryFeeCents(data.deliveryMethod, data.deliveryWindow);

  // This is the actual amount sent to Paystack.
  const itemsAfterCouponCents = Math.max(0, discountedItemsTotalCents - couponDiscountCents);

  const subtotalCents = itemsAfterCouponCents + deliveryFeeCents;

  if (subtotalCents < 1) {
    return NextResponse.json({ error: 'Order total must be greater than zero' }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  const paymentReference = orderNumber;

  await prisma.$runCommandRaw({
    insert: 'StoreOrder',
    documents: [
      {
        _id: orderNumber,
        userId: session.user.id,
        email: session.user.email,
        customerName: data.fullName || session.user.name || '',
        delivery: data,
        items: orderItems,
        itemsSubtotalCents,
        productDiscountCents,
        couponId,
        couponCode,
        couponDiscountCents,
        deliveryFeeCents,
        subtotalCents,
        currency: PAYSTACK_CURRENCY,
        checkoutRequestId: data.checkoutRequestId,
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
      {
        _id: orderNumber,
        userId: session.user.id,
      },
      {
        $set: {
          authorizationUrl: checkout.authorizationUrl,
        },
      },
    );

    return NextResponse.json(
      {
        orderNumber,
        authorizationUrl: checkout.authorizationUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[checkout] Paystack initialization failed:', error);

    await deleteMongoDocument('StoreOrder', orderNumber).catch(() => undefined);

    if (error instanceof PaystackConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Paystack checkout could not be started',
      },
      { status: 502 },
    );
  }
}
