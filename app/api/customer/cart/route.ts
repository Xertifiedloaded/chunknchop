import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

// GET: Fetch user's cart
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            tiers: true,
            variants: true,
            supplier: {
              select: {
                id: true,
                supplierProfile: {
                  select: { storeName: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ cartItems });
  } catch (error) {
    console.error('[v0] Get cart error:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

// POST: Add or update item in cart
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, quantity, selectedTier, selectedVariants } = body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Upsert cart item
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: { userId: user.id, productId },
      },
      create: {
        userId: user.id,
        productId,
        quantity,
        selectedTier: selectedTier || null,
        selectedVariants: selectedVariants || [],
      },
      update: {
        quantity,
        selectedTier: selectedTier || null,
        selectedVariants: selectedVariants || [],
      },
      include: {
        product: {
          include: {
            tiers: true,
            variants: true,
          },
        },
      },
    });

    return NextResponse.json(cartItem);
  } catch (error) {
    console.error('[v0] Add to cart error:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}
