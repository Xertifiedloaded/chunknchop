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
        sku: true,
        stock: true,
        inStock: true,
        meatType: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(products);
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

    const { productId, newStock, changeReason, notes } = await request.json();

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Log inventory change
    await prisma.inventoryLog.create({
      data: {
        productId,
        previousStock: product.stock,
        newStock,
        changeReason,
        notes,
      },
    });

    // Update product stock
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        stock: newStock,
        inStock: newStock > 0,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Inventory update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
