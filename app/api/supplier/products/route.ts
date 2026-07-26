import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { supplierId: user.id },
      include: {
        tiers: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'SUPPLIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, basePrice, stock, category, imageUrl, tiers, variants } = body;

    if (!name || basePrice === undefined || stock === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        basePrice,
        stock,
        category,
        imageUrl,
        supplierId: user.id,
        tiers: tiers
          ? {
              create: tiers.map((tier: any) => ({
                name: tier.name,
                price: tier.price,
                description: tier.description,
              })),
            }
          : undefined,
        variants: variants
          ? {
              create: variants.map((variant: any) => ({
                name: variant.name,
                options: variant.options,
              })),
            }
          : undefined,
      },
      include: {
        tiers: true,
        variants: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
