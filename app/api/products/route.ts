import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ACTIVE_PRODUCT_FILTER } from '@/lib/products';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: ACTIVE_PRODUCT_FILTER,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        meatType: true,
        basePrice: true,
        images: true,
        stock: true,
        inStock: true,
        rating: true,
        reviewCount: true,
        isNewArrival: true,
        isBestSeller: true,
        category: true,
        categoryId: true,
        createdAt: true,
        categoryRef: { select: { id: true, name: true, slug: true } },
      },
    });

    const formatted = products.map((product) => ({
      ...product,
      createdAt: product.createdAt.toISOString(),
      categoryRef: product.categoryRef
        ? { ...product.categoryRef, slug: product.categoryRef.slug.replace(/^\//, '') }
        : null,
    }));

    return NextResponse.json({ products: formatted });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}