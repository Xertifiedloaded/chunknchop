import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: params.id,
        },
      },
    });

    if (!wishlistItem) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.wishlist.delete({
      where: {
        userId_productId: {
          userId: user.id,
          productId: params.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wishlist delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
