import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';
import { uploadProductImage } from '@/lib/storage';
// admin
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        meatType: true,
        images: true,
        basePrice: true,
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

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching admin products:', error);

    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
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
    const categoryId = String(formData.get('categoryId') ?? '').trim();
    const locationId = String(formData.get('locationId') ?? '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!meatType) {
      return NextResponse.json({ error: 'Meat type is required' }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'A category is required' }, { status: 400 });
    }

    if (!locationId) {
      return NextResponse.json({ error: 'A storage location is required to stock this product' }, { status: 400 });
    }

    const [category, location] = await Promise.all([
      prisma.category.findUnique({ where: { id: categoryId } }),
      prisma.storageLocation.findUnique({ where: { id: locationId } }),
    ]);

    // FIXED — this used to check `category.visible`, a field that doesn't
    // exist on the Category model (the schema field is `isActive`).
    // `category.visible` was always `undefined` → falsy, so this rejected
    // every single category and product creation never got past here.
    // This was the real reason category/categoryId ended up empty.
    if (!category || !category.isActive) {
      return NextResponse.json({ error: 'Selected category is invalid or not visible' }, { status: 400 });
    }

    if (!location || !location.isActive) {
      return NextResponse.json({ error: 'Selected storage location is invalid or inactive' }, { status: 400 });
    }

    const basePrice = Number(formData.get('basePrice'));
    const stock = Number(formData.get('stock'));
    const reorderPoint = formData.get('reorderPoint') != null ? Number(formData.get('reorderPoint')) : 0;
    const unit = String(formData.get('unit') ?? 'kg').trim() || 'kg';

    if (!Number.isFinite(basePrice) || basePrice < 0) {
      return NextResponse.json({ error: 'Base price must be a valid non-negative number' }, { status: 400 });
    }

    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      return NextResponse.json({ error: 'Stock must be a valid non-negative whole number' }, { status: 400 });
    }

    if (!Number.isFinite(reorderPoint) || reorderPoint < 0 || !Number.isInteger(reorderPoint)) {
      return NextResponse.json({ error: 'Reorder point must be a valid non-negative whole number' }, { status: 400 });
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
          { error: error instanceof Error ? error.message : 'Image upload failed' },
          { status: 400 }
        );
      }
    }

    // Product + its InventoryRecord + the opening InventoryLog entry are
    // created atomically. If any part fails, nothing is written — you can
    // never end up with a product that has no matching inventory row again.
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name,
          description: String(formData.get('description') ?? ''),
          meatType,
          basePrice,
          stock,
          inStock: stock > 0,
          unit,
          reorderPoint,
          categoryId,
          category: category.name, // FIXED — legacy required string field was never populated; kept in sync with categoryRef.name
          tags: Array.isArray(tags) ? tags : [],
          preparations: Array.isArray(preparations) ? preparations : [],
          isNewArrival: formData.get('isNewArrival') === 'true',
          isBestSeller: formData.get('isBestSeller') === 'true',
          sameDayDelivery: formData.get('sameDayDelivery') === 'true',
          supplierId: user.id,
          images: [...(Array.isArray(existingImages) ? existingImages : []), ...uploadedUrls],
        },
      });

      const record = await tx.inventoryRecord.create({
        data: {
          productId: created.id,
          locationId,
          onHand: stock,
          reorderPoint,
        },
      });

      if (stock > 0) {
        await tx.inventoryLog.create({
          data: {
            productId: created.id,
            previousStock: 0,
            newStock: stock,
            changeReason: 'RESTOCK',
            notes: 'Initial stock on product creation',
            inventoryRecordId: record.id,
            performedById: user.id,
          },
        });
      }

      return created;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
