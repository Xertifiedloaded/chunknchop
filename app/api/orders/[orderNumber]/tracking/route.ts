import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { findMongoDocument } from '@/lib/mongo-collections';

type StoredOrder = {
  _id: string;
  userId?: string;
  riderId?: string;
  riderName?: string;
  status?: string;
  paymentStatus?: string;
  riderLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  };
  items?: Array<{
    productId?: string;
    slug?: string;
    name?: string;
    imageUrl?: string | null;
    quantity?: number;
    unit?: string;
    priceCents?: number;
  }>;
  delivery?: Record<string, unknown>;
  statusHistory?: unknown[];
};

type Context = {
  params: Promise<{
    orderNumber: string;
  }>;
};

export async function GET(_request: Request, { params }: Context) {
  const session = await getSession(await headers());

  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { orderNumber } = await params;

  if (!/^CNC-[A-F\d]{32}$/i.test(orderNumber)) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const order = await findMongoDocument<StoredOrder>('StoreOrder', orderNumber);

  if (!order || (order.userId !== session.user.id && order.riderId !== session.user.id)) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const riderProfile = order.riderId
    ? await prisma.riderProfile.findUnique({
        where: {
          userId: order.riderId,
        },
        select: {
          phone: true,
          photoUrl: true,
          vehicleType: true,
          vehicleColor: true,
          plateNumber: true,
        },
      })
    : null;

  return NextResponse.json(
    {
      id: order._id,
      orderNumber: order._id,

      status: order.status,
      paymentStatus: order.paymentStatus,

      items: (order.items ?? []).map((item) => ({
        name: item.name ?? 'Product',
        imageUrl: item.imageUrl ?? null,
        quantity: item.quantity ?? 1,
      })),

      rider: order.riderId
        ? {
            name: order.riderName,
            ...riderProfile,
            location: order.riderLocation ?? null,
          }
        : null,

      delivery: session.user.id === order.userId ? (order.delivery ?? null) : undefined,

      statusHistory: order.statusHistory ?? [],
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    },
  );
}
