import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toCatalogProduct } from '@/lib/products';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({ where: { slug, published: true } });

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json(toCatalogProduct(product));
}
