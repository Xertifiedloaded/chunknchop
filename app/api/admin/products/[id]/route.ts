import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';
import { uploadProductImage } from '@/lib/storage';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
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


export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Base price must be a valid non-negative number' }, { status: 400 });
    }
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      return NextResponse.json({ error: 'Stock must be a valid non-negative whole number' }, { status: 400 });
    }

    let tags: unknown = [];
    let preparations: unknown = [];
    let existingImages: unknown = [];

    try {
      tags = JSON.parse(String(formData.get('tags') ?? '[]'));
      preparations = JSON.parse(String(formData.get('preparations') ?? '[]'));
      existingImages = JSON.parse(String(formData.get('existingImages') ?? '[]'));
    } catch {
      return NextResponse.json({ error: 'Malformed tags, preparations, or images data' }, { status: 400 });
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

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: String(formData.get('description') ?? ''),
        meatType,
        category: String(formData.get('category') ?? ''),
        basePrice,
        stock,
        inStock: stock > 0,
        tags: Array.isArray(tags) ? tags : [],
        preparations: Array.isArray(preparations) ? preparations : [],
        isNewArrival: formData.get('isNewArrival') === 'true',
        isBestSeller: formData.get('isBestSeller') === 'true',
        sameDayDelivery: formData.get('sameDayDelivery') === 'true',
        images: [...(Array.isArray(existingImages) ? existingImages : []), ...uploadedUrls],
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}