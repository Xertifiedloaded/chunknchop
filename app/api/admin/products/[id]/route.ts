import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasSameOrigin, requireAdminApi } from '@/lib/admin-api';
import { productPatchSchema } from '@/lib/product-validation';
import { toCatalogProduct } from '@/lib/products';
import { deleteProductImageByUrl } from '@/lib/mongo-collections';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });

  const access = await requireAdminApi();
  if (access.response) return access.response;

  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id))
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = productPatchSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'Check the product fields and try again' }, { status: 400 });
  }

  try {
    const previous = await prisma.product.findUnique({
      where: { id },
      select: { imageUrl: true, discountStartsAt: true, discountEndsAt: true },
    });
    const startsAt =
      parsed.data.discountStartsAt !== undefined
        ? parsed.data.discountStartsAt
        : previous?.discountStartsAt;
    const endsAt =
      parsed.data.discountEndsAt !== undefined
        ? parsed.data.discountEndsAt
        : previous?.discountEndsAt;
    if (startsAt && endsAt && endsAt <= startsAt) {
      return NextResponse.json(
        { error: 'Discount end date must be after its start date' },
        { status: 400 },
      );
    }
    const product = await prisma.product.update({ where: { id }, data: parsed.data });
    if (previous && parsed.data.imageUrl && previous.imageUrl !== parsed.data.imageUrl) {
      await deleteProductImageByUrl(previous.imageUrl);
    }
    return NextResponse.json(toCatalogProduct(product));
  } catch (error) {
    if (isUniqueConflict(error))
      return NextResponse.json({ error: 'That product URL is already in use' }, { status: 409 });
    if (isMissingRecord(error))
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ error: 'Unable to update this product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });

  const access = await requireAdminApi();
  if (access.response) return access.response;

  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id))
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { imageUrl: true, discountStartsAt: true, discountEndsAt: true },
    });
    await prisma.product.delete({ where: { id } });
    if (product) await deleteProductImageByUrl(product.imageUrl);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isMissingRecord(error))
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ error: 'Unable to delete this product' }, { status: 500 });
  }
}

function isUniqueConflict(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

function isMissingRecord(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025';
}
