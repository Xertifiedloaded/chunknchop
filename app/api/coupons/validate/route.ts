
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';

import { getSession } from '@/lib/auth';
import { hasSameOrigin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
import { getEffectiveProductPrice } from '@/lib/products';
import { findMongoDocument } from '@/lib/mongo-collections';

const schema = z.object({
  code: z.string().trim().min(1).max(32),
});

type StoredCart = {
  items?: Array<{
    slug?: unknown;
    quantity?: unknown;
  }>;
};

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { error: 'Invalid request origin' },
      { status: 403 },
    );
  }

  const session = await getSession(await headers());

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Sign in before applying a coupon' },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Enter a valid coupon code' },
      { status: 400 },
    );
  }

  const cart = await findMongoDocument<StoredCart>(
    'UserCart',
    session.user.id,
  );

  const cartItems = (cart?.items ?? []).filter(
    (item): item is { slug: string; quantity: number } =>
      typeof item.slug === 'string' &&
      Number.isInteger(item.quantity) &&
      Number(item.quantity) >= 1 &&
      Number(item.quantity) <= 99,
  );

  if (!cartItems.length) {
    return NextResponse.json(
      { error: 'Your bag is empty' },
      { status: 409 },
    );
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

  const productMap = new Map(
    products.map((product) => [product.slug, product]),
  );

  const subtotalCents = cartItems.reduce((total, item) => {
    const product = productMap.get(item.slug);

    if (!product) return total;

    return (
      total +
      getEffectiveProductPrice(product) * item.quantity
    );
  }, 0);

  const code = parsed.data.code.trim().toUpperCase();

  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    return NextResponse.json(
      { error: 'Coupon does not exist. Check the saved coupon code.' },
      { status: 400 },
    );
  }

  const now = new Date();

  let failureReason: string | null = null;

  if (!coupon.active) {
    failureReason = 'This coupon is inactive.';
  } else if (coupon.startsAt && coupon.startsAt > now) {
    failureReason = 'This coupon is not active yet.';
  } else if (coupon.expiresAt && coupon.expiresAt < now) {
    failureReason = 'This coupon has expired.';
  } else if (
    coupon.usageLimit !== null &&
    coupon.usageCount >= coupon.usageLimit
  ) {
    failureReason = 'This coupon has reached its usage limit.';
  }

  if (failureReason) {
    console.error('[COUPON VALIDATION]', {
      code,
      failureReason,
      coupon: {
        code: coupon.code,
        active: coupon.active,
        startsAt: coupon.startsAt,
        expiresAt: coupon.expiresAt,
        usageLimit: coupon.usageLimit,
        usageCount: coupon.usageCount,
      },
    });

    return NextResponse.json(
      { error: failureReason },
      { status: 400 },
    );
  }

  if (subtotalCents < coupon.minimumOrderCents) {
    return NextResponse.json(
      { error: 'Your order does not meet this coupon minimum' },
      { status: 400 },
    );
  }

  let discountCents = 0;

  if (coupon.discountType === 'PERCENTAGE') {
    if (
      coupon.discountValue < 1 ||
      coupon.discountValue > 100
    ) {
      return NextResponse.json(
        { error: 'This coupon has an invalid discount configuration' },
        { status: 400 },
      );
    }

    discountCents = Math.round(
      (subtotalCents * coupon.discountValue) / 100,
    );
  } else if (coupon.discountType === 'FIXED') {
    if (coupon.discountValue < 1) {
      return NextResponse.json(
        { error: 'This coupon has an invalid discount configuration' },
        { status: 400 },
      );
    }

    discountCents = coupon.discountValue;
  } else {
    return NextResponse.json(
      { error: 'This coupon has an invalid discount configuration' },
      { status: 400 },
    );
  }

  if (coupon.maximumDiscountCents !== null) {
    discountCents = Math.min(
      discountCents,
      coupon.maximumDiscountCents,
    );
  }

  discountCents = Math.min(discountCents, subtotalCents);

  if (discountCents <= 0) {
    return NextResponse.json(
      { error: 'This coupon does not provide a valid discount' },
      { status: 400 },
    );
  }

  return NextResponse.json({
    code: coupon.code,
    discountCents,
    message: 'Coupon applied successfully',
  });
}
