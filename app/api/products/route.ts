import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const meatType = searchParams.get('meatType');

    const products = await prisma.product.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(meatType ? { meatType } : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        basePrice: true,
        stock: true,
        inStock: true,
        category: true,
        meatType: true,
        tags: true,
        preparations: true,
        isNewArrival: true,
        isBestSeller: true,
        sameDayDelivery: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
