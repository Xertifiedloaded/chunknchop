import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
const headers = { 'Cache-Control': 'private, no-store' };

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApi();
  if (access.response) return access.response;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  const data: Prisma.CouponUpdateInput = {};
  if (typeof body.active === 'boolean') data.active = body.active;
  if (body.discountType !== undefined || body.discountValue !== undefined) {
    const discountType =
      body.discountType === 'fixed' || body.discountType === 'FIXED'
        ? 'FIXED'
        : body.discountType === 'percentage' || body.discountType === 'PERCENTAGE'
          ? 'PERCENTAGE'
          : null;
    const discountValue = Number(body.discountValue);
    if (
      !discountType ||
      !Number.isInteger(discountValue) ||
      discountValue <= 0 ||
      (discountType === 'PERCENTAGE' && discountValue > 100)
    )
      return NextResponse.json({ error: 'Invalid discount settings' }, { status: 400 });
    data.discountType = discountType;
    data.discountValue = discountValue;
  }
  if (body.minOrderCents !== undefined) {
    const value = Number(body.minOrderCents);
    if (!Number.isInteger(value) || value < 0)
      return NextResponse.json({ error: 'Invalid minimum order amount' }, { status: 400 });
    data.minimumOrderCents = value;
  }
  if (body.maxDiscountCents !== undefined) {
    const value = body.maxDiscountCents === null ? null : Number(body.maxDiscountCents);
    if (value !== null && (!Number.isInteger(value) || value < 0))
      return NextResponse.json({ error: 'Invalid maximum discount' }, { status: 400 });
    data.maximumDiscountCents = value;
  }
  if (body.usageLimit !== undefined) {
    const value = body.usageLimit === null ? null : Number(body.usageLimit);
    if (value !== null && (!Number.isInteger(value) || value < 1))
      return NextResponse.json({ error: 'Invalid usage limit' }, { status: 400 });
    data.usageLimit = value;
  }
  for (const key of ['startsAt', 'expiresAt'] as const)
    if (body[key] !== undefined) {
      const date = body[key] ? new Date(body[key]) : null;
      if (date && Number.isNaN(date.getTime()))
        return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
      data[key] = date;
    }
  if (body.code !== undefined) {
    if (typeof body.code !== 'string' || !/^[A-Z0-9_-]{3,32}$/i.test(body.code.trim()))
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    data.code = body.code.trim().toUpperCase();
  }
  try {
    await prisma.coupon.update({ where: { id }, data });
    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
    console.error('[admin/coupons] PATCH failed', error);
    return NextResponse.json({ error: 'Unable to update coupon' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminApi();
  if (access.response) return access.response;
  const { id } = await context.params;
  try {
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    console.error('[admin/coupons] DELETE failed', error);
    return NextResponse.json({ error: 'Unable to delete coupon' }, { status: 500 });
  }
}
