import { NextRequest, NextResponse } from 'next/server';

import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        id,
      },
    });

    if (!cartItem || cartItem.userId !== user.id) {
      return NextResponse.json(
        {
          error: 'Cart item not found',
        },
        {
          status: 404,
        }
      );
    }

    await prisma.cartItem.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('[cart DELETE] Failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to remove item from cart',
      },
      {
        status: 500,
      }
    );
  }
}
