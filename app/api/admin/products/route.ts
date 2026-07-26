import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        meatType: true,
        basePrice: true,
        stock: true,
        inStock: true,
        rating: true,
        reviewCount: true,
        isNewArrival: true,
        isBestSeller: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        meatType: data.meatType,
        basePrice: data.basePrice,
        stock: data.stock,
        inStock: data.stock > 0,
        category: data.category,
        tags: data.tags || [],
        preparations: data.preparations || [],
        isNewArrival: data.isNewArrival || false,
        isBestSeller: data.isBestSeller || false,
        sameDayDelivery: data.sameDayDelivery || false,
        supplierId: user.id,
        images: data.images || [],
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
