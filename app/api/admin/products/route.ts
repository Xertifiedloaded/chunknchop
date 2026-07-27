import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';
import { uploadProductImage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
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
    });

    const formattedProducts = products.map((product) => ({
      ...product,
      basePrice: Number(product.basePrice),
      rating: Number(product.rating),
      reviewCount: Number(product.reviewCount),
      stock: Number(product.stock),
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching admin products:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch products',
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    const name = String(formData.get('name') ?? '').trim();
    const meatType = String(formData.get('meatType') ?? '');

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!meatType) {
      return NextResponse.json({ error: 'Meat type is required' }, { status: 400 });
    }

    const basePrice = Number(formData.get('basePrice'));
    const stock = Number(formData.get('stock'));

    if (!Number.isFinite(basePrice) || basePrice < 0) {
      return NextResponse.json(
        {
          error: 'Base price must be a valid non-negative number',
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      return NextResponse.json(
        {
          error: 'Stock must be a valid non-negative whole number',
        },
        { status: 400 }
      );
    }

    let tags: unknown = [];
    let preparations: unknown = [];
    let existingImages: unknown = [];

    try {
      tags = JSON.parse(String(formData.get('tags') ?? '[]'));

      preparations = JSON.parse(String(formData.get('preparations') ?? '[]'));

      existingImages = JSON.parse(String(formData.get('existingImages') ?? '[]'));
    } catch {
      return NextResponse.json(
        {
          error: 'Malformed tags, preparations, or images data',
        },
        { status: 400 }
      );
    }

    const imageFiles = formData.getAll('images').filter((value): value is File => value instanceof File);

    const uploadedUrls: string[] = [];

    for (const file of imageFiles) {
      try {
        const imageUrl = await uploadProductImage(file);
        uploadedUrls.push(imageUrl);
      } catch (error) {
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : 'Image upload failed',
          },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.create({
      data: {
        name,

        description: String(formData.get('description') ?? ''),

        meatType,

        basePrice,

        stock,

        inStock: stock > 0,

        category: String(formData.get('category') ?? ''),

        tags: Array.isArray(tags) ? tags : [],

        preparations: Array.isArray(preparations) ? preparations : [],

        isNewArrival: formData.get('isNewArrival') === 'true',

        isBestSeller: formData.get('isBestSeller') === 'true',

        sameDayDelivery: formData.get('sameDayDelivery') === 'true',

        supplierId: user.id,

        images: [...(Array.isArray(existingImages) ? existingImages : []), ...uploadedUrls],
      },
    });

    return NextResponse.json(product, {
      status: 201,
    });
  } catch (error) {
    console.error('Error creating product:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      {
        status: 500,
      }
    );
  }
}
