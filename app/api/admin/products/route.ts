import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasSameOrigin, requireAdminApi } from '@/lib/admin-api';
import { productInputSchema, validationErrorResponse } from '@/lib/product-validation';
import { toCatalogProduct } from '@/lib/products';

export async function GET() {
  const access = await requireAdminApi();
  if (access.response) return access.response;

  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ products: products.map(toCatalogProduct) });
  } catch (error) {
    console.error('Failed to load products:', error);
    return NextResponse.json({ error: 'Unable to load products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });

  const access = await requireAdminApi();
  if (access.response) return access.response;

  const body = await request.json().catch(() => null);
  if (process.env.NODE_ENV !== 'production') {
    console.log('BODY RECEIVED:', JSON.stringify(body, null, 2));
  }
  if (body === null || typeof body !== 'object') {
    return NextResponse.json(
      { error: 'Request body must be JSON (check Content-Type: application/json)' },
      { status: 400 },
    );
  }

  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error);

  try {
    const product = await prisma.product.create({ data: parsed.data });
    return NextResponse.json(toCatalogProduct(product), { status: 201 });
  } catch (error) {
    if (isUniqueConflict(error))
      return NextResponse.json({ error: 'That product URL is already in use' }, { status: 409 });
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: 'Unable to save this product' }, { status: 500 });
  }
}

function isUniqueConflict(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}
