import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const headers = { 'Cache-Control': 'private, no-store' };
function toClientCoupon(coupon: {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minimumOrderCents: number;
  maximumDiscountCents: number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  active: boolean;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType.toLowerCase() === 'fixed' ? 'fixed' : 'percentage',
    discountValue: coupon.discountValue,
    minOrderCents: coupon.minimumOrderCents,
    maxDiscountCents: coupon.maximumDiscountCents,
    usageLimit: coupon.usageLimit,
    usageCount: coupon.usageCount,
    startsAt: coupon.startsAt?.toISOString() ?? null,
    expiresAt: coupon.expiresAt?.toISOString() ?? null,
    active: coupon.active,
    description: coupon.description ?? '',
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  };
}

export async function GET() {
  const access = await requireAdminApi();
  if (access.response) return access.response;
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(
      { coupons: coupons.map((coupon) => toClientCoupon(coupon)) },
      { headers },
    );
  } catch (error) {
    console.error('[admin/coupons] GET failed', error);
    return NextResponse.json({ error: 'Unable to load coupons' }, { status: 500, headers });
  }
}

export async function POST(request: Request) {
  const access = await requireAdminApi();
  if (access.response) return access.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.code !== 'string' || !/^[A-Z0-9_-]{3,32}$/i.test(body.code.trim()))
    return NextResponse.json(
      { error: 'Enter a valid coupon code (3–32 letters, numbers, _ or -).' },
      { status: 400 },
    );
  const discountType =
    body.discountType === 'fixed'
      ? 'FIXED'
      : body.discountType === 'percentage'
        ? 'PERCENTAGE'
        : null;
  const discountValue = Number(body.discountValue);
  const minimumOrderCents = Number(body.minOrderCents ?? 0);
  const maximumDiscountCents =
    body.maxDiscountCents === '' || body.maxDiscountCents == null
      ? null
      : Number(body.maxDiscountCents);
  const usageLimit =
    body.usageLimit === '' || body.usageLimit == null ? null : Number(body.usageLimit);
  const startsAt = body.startsAt ? new Date(body.startsAt) : null;
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if (
    !discountType ||
    !Number.isInteger(discountValue) ||
    discountValue <= 0 ||
    (discountType === 'PERCENTAGE' && discountValue > 100) ||
    !Number.isInteger(minimumOrderCents) ||
    minimumOrderCents < 0 ||
    (maximumDiscountCents !== null &&
      (!Number.isInteger(maximumDiscountCents) || maximumDiscountCents < 0)) ||
    (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) ||
    (startsAt && Number.isNaN(startsAt.getTime())) ||
    (expiresAt && Number.isNaN(expiresAt.getTime())) ||
    (startsAt && expiresAt && expiresAt <= startsAt)
  )
    return NextResponse.json(
      { error: 'Check the discount, limits and date fields.' },
      { status: 400 },
    );
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: body.code.trim().toUpperCase(),
        discountType,
        discountValue,
        minimumOrderCents,
        maximumDiscountCents,
        usageLimit,
        startsAt,
        expiresAt,
        active: body.active !== false,
      },
    });
    return NextResponse.json({ coupon: toClientCoupon(coupon) }, { status: 201, headers });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002')
      return NextResponse.json(
        { error: 'A coupon with this code already exists.' },
        { status: 409 },
      );
    console.error('[admin/coupons] POST failed', error);
    return NextResponse.json({ error: 'Unable to create coupon' }, { status: 500 });
  }
}
