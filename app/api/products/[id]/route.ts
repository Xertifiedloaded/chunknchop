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
        categoryId: true,
        categoryRef: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
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


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    try {
      await prisma.product.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        mode: 'deleted',
        message: `"${product.name}" was deleted successfully.`,
      });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2003'
      ) {
        const archivedProduct = await prisma.product.update({
          where: { id },
          data: {
            inStock: false,
            stock: 0,
            isArchived: true,
          },
          select: {
            id: true,
            name: true,
            inStock: true,
            stock: true,
            isArchived: true,
          },
        });

        return NextResponse.json({
          success: true,
          mode: 'archived',
          product: archivedProduct,
          message: `"${product.name}" has existing orders, so it was archived instead of deleted to preserve order history.`,
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Error deleting product:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}