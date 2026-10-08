import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    let user;
    try {
      user = getUserFromRequest(req);
    } catch (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Order id is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                categoryRef: {
                  select: { id: true, name: true, slug: true, color: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.customerId !== user.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch order',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
