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

const checkoutSchema = z
  .object({
    fullName: z.string().trim().max(100).default(''),
    phone: z.string().trim().max(32).default(''),
    addressLine1: z.string().trim().max(160).default(''),
    addressLine2: z.string().trim().max(160).default(''),
    area: z.string().trim().max(80).default(''),
    city: z.string().trim().max(80).default(''),

    state: z.string().trim().max(80).optional(),
    region: z.string().trim().max(80).default(''),

    postalCode: z.string().trim().max(20).default(''),

    deliveryMethod: z.enum(deliveryMethods).default('home'),
    deliveryDate: z.string().optional(),
    deliveryWindow: z.string().max(80).optional(),
    deliverySlotId: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .optional(),

    deliveryNotes: z.string().trim().max(500).default(''),

    checkoutRequestId: z.string().uuid(),
    couponCode: z.string().trim().max(32).optional(),
  })
  .strict()
  .superRefine((data, context) => {
    if (data.deliveryMethod === 'home') {
      const deliveryState = data.state?.trim() || data.region.trim();

      const requiredFields: Array<{
        field: string;
        value: string;
      }> = [
        { field: 'fullName', value: data.fullName },
        { field: 'phone', value: data.phone },
        { field: 'addressLine1', value: data.addressLine1 },
        { field: 'area', value: data.area },
        { field: 'city', value: data.city },
        { field: 'state', value: deliveryState },
      ];

      for (const field of requiredFields) {
        if (!field.value) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field.field],
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

      if (data.area.length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['area'],
          message: 'Enter a valid delivery area',
        });
      }

      if (data.city.length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['city'],
          message: 'Enter a valid city',
        });
      }

      if (deliveryState.length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['state'],
          message: 'Enter a valid state',
        });
      }

      if (!data.deliverySlotId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['deliverySlotId'],
          message: 'Choose an available delivery date and time',
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

function formatDeliveryWindow(startsAt: Date, endsAt: Date) {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Lagos',
  };

  const start = startsAt.toLocaleTimeString('en-NG', options);
  const end = endsAt.toLocaleTimeString('en-NG', options);

  return `${start} – ${end}`;
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
      {
        error: 'Check the delivery details and try again',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const deliveryState = data.state?.trim() || data.region.trim();

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
      {
        error: 'One or more products are no longer available',
      },
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
        {
          error: 'This coupon is invalid, expired or unavailable',
        },
        { status: 400 },
      );
    }

    if (discountedItemsTotalCents < coupon.minimumOrderCents) {
      return NextResponse.json(
        {
          error: 'Your order does not meet this coupon minimum',
        },
        { status: 400 },
      );
    }

    couponDiscountCents = calculateCouponDiscount(coupon, discountedItemsTotalCents);

    if (couponDiscountCents <= 0) {
      return NextResponse.json(
        {
          error: 'This coupon does not provide a valid discount',
        },
        { status: 400 },
      );
    }

    couponId = coupon.id;
    couponCode = coupon.code;
  }

  const deliveryZone =
    data.deliveryMethod === 'home'
      ? await prisma.deliveryZone.findFirst({
          where: {
            name: {
              equals: data.area,
              mode: 'insensitive',
            },
            city: {
              equals: data.city,
              mode: 'insensitive',
            },
            state: {
              equals: deliveryState,
              mode: 'insensitive',
            },
            active: true,
          },
        })
      : null;

  if (data.deliveryMethod === 'home' && !deliveryZone) {
    return NextResponse.json(
      {
        error:
          'Home delivery is not configured for this area yet. Choose a supported delivery zone or contact us.',
      },
      { status: 400 },
    );
  }

  const deliverySlot =
    data.deliveryMethod === 'home' && data.deliverySlotId && deliveryZone
      ? await prisma.deliverySchedule.findFirst({
          where: {
            id: data.deliverySlotId,
            zoneId: deliveryZone.id,
            active: true,
            startsAt: { gt: new Date() },
          },
        })
      : null;

  if (data.deliveryMethod === 'home' && !deliverySlot) {
    return NextResponse.json(
      {
        error: 'That delivery date or time is no longer available. Please choose another slot.',
      },
      { status: 409 },
    );
  }

  const deliveryFeeCents = data.deliveryMethod === 'home' ? deliveryZone!.deliveryFeeCents : 0;

  const itemsAfterCouponCents = Math.max(0, discountedItemsTotalCents - couponDiscountCents);

  const subtotalCents = itemsAfterCouponCents + deliveryFeeCents;

  if (subtotalCents < 1) {
    return NextResponse.json({ error: 'Order total must be greater than zero' }, { status: 400 });
  }

  let slotReserved = false;

  if (deliverySlot) {
    const reservation = await prisma.deliverySchedule.updateMany({
      where: {
        id: deliverySlot.id,
        active: true,
        startsAt: { gt: new Date() },
        bookedCount: {
          lt: deliverySlot.capacity,
        },
      },
      data: {
        bookedCount: { increment: 1 },
      },
    });

    if (!reservation.count) {
      return NextResponse.json(
        {
          error: 'That delivery slot has just become fully booked. Choose another time.',
        },
        { status: 409 },
      );
    }

    slotReserved = true;
  }

  const createdAt = new Date().toISOString();
  const paymentReference = orderNumber;

  const deliveryDetails = {
    deliveryMethod: data.deliveryMethod,
    fullName: data.deliveryMethod === 'home' ? data.fullName : '',
    phone: data.deliveryMethod === 'home' ? data.phone : '',
    addressLine1: data.deliveryMethod === 'home' ? data.addressLine1 : '',
    addressLine2: data.deliveryMethod === 'home' ? data.addressLine2 : '',
    area: data.deliveryMethod === 'home' ? data.area : '',
    city: data.deliveryMethod === 'home' ? data.city : '',
    state: data.deliveryMethod === 'home' ? deliveryState : '',
    region: data.deliveryMethod === 'home' ? deliveryState : '',
    postalCode: data.deliveryMethod === 'home' ? data.postalCode : '',
    deliveryNotes: data.deliveryNotes,
    deliverySlotId: deliverySlot?.id ?? null,
    deliveryDate: deliverySlot?.startsAt.toISOString() ?? null,
    deliveryWindow: deliverySlot
      ? formatDeliveryWindow(deliverySlot.startsAt, deliverySlot.endsAt)
      : null,
  };

  try {
    await prisma.$runCommandRaw({
      insert: 'StoreOrder',
      documents: [
        {
          _id: orderNumber,
          userId: session.user.id,
          email: session.user.email,
          customerName: data.deliveryMethod === 'home' ? data.fullName : session.user.name || '',
          delivery: deliveryDetails,
          deliveryZoneId: deliveryZone?.id ?? null,
          deliveryScheduleId: deliverySlot?.id ?? null,
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
  } catch (error) {
    if (slotReserved && deliverySlot) {
      await prisma.deliverySchedule
        .updateMany({
          where: {
            id: deliverySlot.id,
            bookedCount: { gt: 0 },
          },
          data: {
            bookedCount: { decrement: 1 },
          },
        })
        .catch(() => undefined);
    }

    console.error('[checkout] Order creation failed:', error);

    return NextResponse.json(
      { error: 'Your order could not be created. Please try again.' },
      { status: 500 },
    );
  }

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

    if (slotReserved && deliverySlot) {
      await prisma.deliverySchedule
        .updateMany({
          where: {
            id: deliverySlot.id,
            bookedCount: { gt: 0 },
          },
          data: {
            bookedCount: { decrement: 1 },
          },
        })
        .catch(() => undefined);
    }

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
