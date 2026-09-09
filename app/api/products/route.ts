import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import { prisma } from '@/lib/db';
import { uploadProductImage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
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
        inventoryRecords: {
          select: {
            id: true,
            onHand: true,
            location: { select: { id: true, name: true } },
          },
        },
      },
    });

    const formatted = products.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      rating: Number(p.rating),
      reviewCount: Number(p.reviewCount),
      stock: Number(p.stock),
      createdAt: p.createdAt.toISOString(),
      categoryRef: p.categoryRef
        ? {
            ...p.categoryRef,
            slug: p.categoryRef.slug.replace(/^\//, ''),
          }
        : null,
    }));

    return NextResponse.json({ products: formatted });
  } catch (error) {
    console.error('Error fetching products:', error);

    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
