import { NextRequest, NextResponse } from 'next/server';
import { MeatType } from '@prisma/client';
import { getUserFromRequest } from '@/lib/request';
import { prisma } from '@/lib/db';
import { uploadProductImage } from '@/lib/storage';
import { resolveCategory, resolveLocation } from '@/lib/catalog';

const text = (formData: FormData, key: string) => String(formData.get(key) ?? '').trim();

const parseJsonArray = (value: FormDataEntryValue | null): string[] => {
  const parsed = JSON.parse(String(value ?? '[]'));
  return Array.isArray(parsed) ? parsed.map(String) : [];
};

const isNonNegativeInt = (value: number) => Number.isInteger(value) && value >= 0;

const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

const toMeatType = (name: string): MeatType | null => {
  const key = name.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return key in MeatType ? MeatType[key as keyof typeof MeatType] : null;
};

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const includeArchived = request.nextUrl.searchParams.get('includeArchived') === 'true';

    const products = await prisma.product.findMany({
      where: includeArchived ? undefined : { isArchived: false },
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
        isActive: true,
        isArchived: true,
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

    return NextResponse.json(products);
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

    const name = text(formData, 'name');
    if (!name) return badRequest('Name is required');

    const [category, location] = await Promise.all([
      resolveCategory({
        id: text(formData, 'categoryId'),
        newName: text(formData, 'newCategoryName'),
        newColor: text(formData, 'newCategoryColor'),
      }),
      resolveLocation({
        id: text(formData, 'locationId'),
        newName: text(formData, 'newLocationName'),
        newType: text(formData, 'newLocationType'),
      }),
    ]);

    if (category.error) return badRequest(category.error);
    if (location.error) return badRequest(location.error);

    const categoryName = category.existing?.name ?? category.create?.name ?? '';
    const meatType = toMeatType(categoryName);
    if (!meatType) {
      return badRequest(`Category "${categoryName}" does not map to a supported meat type`);
    }

    const basePrice = Number(formData.get('basePrice'));
    const stock = Number(formData.get('stock'));
    const reorderPoint = text(formData, 'reorderPoint') === '' ? 0 : Number(formData.get('reorderPoint'));
    const unit = text(formData, 'unit') || 'kg';

    if (!Number.isFinite(basePrice) || basePrice < 0) return badRequest('Base price must be a valid non-negative number');
    if (!isNonNegativeInt(stock)) return badRequest('Stock must be a valid non-negative whole number');
    if (!isNonNegativeInt(reorderPoint)) return badRequest('Reorder point must be a valid non-negative whole number');

    let tags: string[];
    let preparations: string[];
    let existingImages: string[];

    try {
      tags = parseJsonArray(formData.get('tags'));
      preparations = parseJsonArray(formData.get('preparations'));
      existingImages = parseJsonArray(formData.get('existingImages'));
    } catch {
      return badRequest('Malformed tags, preparations, or images data');
    }

    const imageFiles = formData.getAll('images').filter((value): value is File => value instanceof File);

    let uploadedUrls: string[];

    try {
      uploadedUrls = await Promise.all(imageFiles.map((file) => uploadProductImage(file)));
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Image upload failed');
    }

    const result = await prisma.$transaction(async (tx) => {
      const resolvedCategory = category.existing ?? (await tx.category.create({ data: category.create }));
      const resolvedLocation = location.existing ?? (await tx.storageLocation.create({ data: location.create }));

      const product = await tx.product.create({
        data: {
          name,
          description: text(formData, 'description'),
          meatType, // enum value, not the display name
          category: resolvedCategory.name,
          categoryId: resolvedCategory.id,
          basePrice,
          stock,
          inStock: stock > 0,
          unit,
          reorderPoint,
          tags,
          preparations,
          isNewArrival: formData.get('isNewArrival') === 'true',
          isBestSeller: formData.get('isBestSeller') === 'true',
          sameDayDelivery: formData.get('sameDayDelivery') === 'true',
          supplierId: user.id,
          images: [...existingImages, ...uploadedUrls],
        },
      });

      const record = await tx.inventoryRecord.create({
        data: { productId: product.id, locationId: resolvedLocation.id, onHand: stock, reorderPoint },
      });

      if (stock > 0) {
        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            productName: product.name,
            previousStock: 0,
            newStock: stock,
            changeReason: 'RESTOCK',
            notes: 'Initial stock on product creation',
            inventoryRecordId: record.id,
            performedById: user.id,
          },
        });
      }

      return { product, categoryCreated: !category.existing, locationCreated: !location.existing };
    });

    return NextResponse.json(
      { ...result.product, categoryCreated: result.categoryCreated, locationCreated: result.locationCreated },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'A category, location or product with these details already exists' }, { status: 409 });
    }

    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}