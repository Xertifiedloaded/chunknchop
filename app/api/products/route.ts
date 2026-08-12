import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';
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
        categoryRef: { select: { id: true, name: true } },
        inventoryRecords: {
          select: {
            id: true,
            onHand: true,
            location: { select: { id: true, name: true } },
          },
        },
      },
    });

    const formattedProducts = products.map((product) => ({
      ...product,
      basePrice: Number(product.basePrice),
      rating: Number(product.rating),
      reviewCount: Number(product.reviewCount),
      stock: Number(product.stock),
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);

    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
