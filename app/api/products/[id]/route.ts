import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: {
        id,
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
        tiers: true,
        variants: true,
        supplier: {
          select: {
            id: true,
            name: true,
            supplierProfile: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
