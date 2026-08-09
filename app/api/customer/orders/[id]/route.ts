import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
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

    console.log('Order ID:', id);

    // If your Order.id is an Int/autoincrement column instead of a String
    // (cuid/uuid), uncomment the next two lines and use numericId below:
    //
    // const numericId = Number(id);
    // if (Number.isNaN(numericId)) {
    //   return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    // }

    const order = await prisma.order.findUnique({
      where: {
        id, // swap to numericId here if your schema uses an Int id
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log('Found order:', order?.id ?? 'NOT FOUND');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.customerId !== user.id) {
      // Return 404 rather than 403 so we don't leak the existence
      // of orders that belong to other customers.
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
