import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: user.id,
      },
      include: {
        product: {
          include: {
            tiers: true,
            variants: true,
            supplier: {
              select: {
                id: true,
                supplierProfile: {
                  select: {
                    storeName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    return NextResponse.json({
      cartItems,
    });
  } catch (error) {
    console.error('[cart GET] Failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch cart',
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const { productId, quantity, selectedTier, selectedPreparation, selectedVariants } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (quantity > product.stock) {
      return NextResponse.json(
        {
          error: `Only ${product.stock} items available`,
        },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },

      create: {
        userId: user.id,
        productId,
        quantity,
        selectedTier: selectedTier || null,
        selectedPreparation: selectedPreparation || null,
        selectedVariants: selectedVariants || [],
      },

      update: {
        quantity,
        selectedTier: selectedTier || null,
        selectedPreparation: selectedPreparation || null,
        selectedVariants: selectedVariants || [],
      },

      include: {
        product: {
          include: {
            tiers: true,
            variants: true,
            supplier: {
              select: {
                id: true,
                supplierProfile: {
                  select: {
                    storeName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(cartItem, { status: 200 });
  } catch (error) {
    console.error('[cart] add/update error:', error);

    return NextResponse.json(
      {
        error: 'Failed to update cart',
      },
      { status: 500 }
    );
  }
}
