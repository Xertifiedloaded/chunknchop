import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wishlist = await prisma.wishlist.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            basePrice: true,
            meatType: true,
            rating: true,
            inStock: true,
          },
        },
      },
    });

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Wishlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await request.json();

    const existingWishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existingWishlistItem) {
      return NextResponse.json({ error: 'Already in wishlist' }, { status: 400 });
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: user.id,
        productId,
      },
    });

    return NextResponse.json(wishlistItem);
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
