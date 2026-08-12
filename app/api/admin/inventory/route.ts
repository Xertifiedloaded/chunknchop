import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';
import { adjustInventoryRecord, getInventoryStatus } from '@/lib/inventory';
import { InventoryChangeReason } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const search = searchParams.get('search')?.trim();

    const records = await prisma.inventoryRecord.findMany({
      where: {
        ...(locationId ? { locationId } : {}),
        ...(search
          ? {
              product: {
                OR: [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }],
              },
            }
          : {}),
      },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        location: { select: { id: true, name: true } },
      },
      orderBy: { product: { name: 'asc' } },
    });

    const items = records.map((r) => ({
      id: r.id,
      productId: r.product.id,
      name: r.product.name,
      sku: r.product.sku ?? '—',
      locationId: r.location.id,
      location: r.location.name,
      onHand: r.onHand,
      committed: r.committed,
      incoming: r.incoming > 0 ? `${r.incoming} ${r.product.unit}` : '—',
      reorderAt: r.reorderPoint,
      expiry: r.expiryDate ? r.expiryDate.toISOString() : '—',
      status: getInventoryStatus(r),
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error('Inventory error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inventoryRecordId, newOnHand, changeReason, notes } = await request.json();

    if (!inventoryRecordId || typeof inventoryRecordId !== 'string') {
      return NextResponse.json({ error: 'inventoryRecordId is required' }, { status: 400 });
    }

    if (typeof newOnHand !== 'number' || !Number.isInteger(newOnHand) || newOnHand < 0) {
      return NextResponse.json({ error: 'newOnHand must be a non-negative whole number' }, { status: 400 });
    }

    if (!changeReason || !Object.values(InventoryChangeReason).includes(changeReason)) {
      return NextResponse.json({ error: `changeReason must be one of: ${Object.values(InventoryChangeReason).join(', ')}` }, { status: 400 });
    }

    const updated = await adjustInventoryRecord({
      inventoryRecordId,
      newOnHand,
      changeReason,
      notes,
      performedById: user.id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Inventory update error:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
