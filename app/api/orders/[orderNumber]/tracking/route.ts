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
  currency?: string;

  items?: Array<{
    productId?: string;
    slug?: string;
    name?: string;
    imageUrl?: string | null;
    quantity?: number;
    unit?: string;
    priceCents?: number;
    originalPriceCents?: number;
    productDiscountCents?: number;
  }>;

  itemsSubtotalCents?: number;
  productDiscountCents?: number;
  couponDiscountCents?: number;
  deliveryFeeCents?: number;
  subtotalCents?: number;

  delivery?: Record<string, unknown>;

  riderLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  } | null;

  statusHistory?: unknown[];
};

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

const toAmount = (value: unknown): number => {
  return typeof value === 'number' && Number.isFinite(value) ? value / 100 : 0;
};

const isPaymentSuccessful = (status?: string) => {
  return ['paid', 'success', 'successful', 'completed'].includes((status ?? '').toLowerCase());
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await getSession(await headers());

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { orderNumber } = await params;

    if (!/^CNC-[A-F\d]{32}$/i.test(orderNumber)) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = await findMongoDocument<StoredOrder>('StoreOrder', orderNumber);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isOrderOwner = order.userId === session.user.id;

    const isAssignedRider = Boolean(order.riderId) && order.riderId === session.user.id;

    const isAdmin = session.user.role?.toLowerCase() === 'admin';

    if (!isOrderOwner && !isAssignedRider && !isAdmin) {
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
            user: {
              select: {
                name: true,
              },
            },
          },
        })
      : null;

    const items = (order.items ?? []).map((item) => {
      const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;

      const unitPriceCents = typeof item.priceCents === 'number' ? item.priceCents : 0;

      return {
        productId: item.productId ?? null,
        slug: item.slug ?? null,
        name: item.name ?? 'Product',
        imageUrl: item.imageUrl ?? null,
        unit: item.unit ?? null,
        quantity,
        unitPrice: toAmount(unitPriceCents),
        totalPrice: toAmount(unitPriceCents * quantity),
      };
    });

    const orderTotalCents = typeof order.subtotalCents === 'number' ? order.subtotalCents : 0;

    const paymentSuccessful = isPaymentSuccessful(order.paymentStatus);

    const orderTotal = toAmount(orderTotalCents);

    const totalPaid = paymentSuccessful ? orderTotal : null;

    return NextResponse.json(
      {
        id: order._id,
        orderNumber: order._id,

        status: order.status ?? 'payment_pending',
        paymentStatus: order.paymentStatus ?? 'pending',
        currency: order.currency ?? 'NGN',

        items,

        itemsSubtotal: toAmount(order.itemsSubtotalCents),
        productDiscount: toAmount(order.productDiscountCents),
        couponDiscount: toAmount(order.couponDiscountCents),
        deliveryFee: toAmount(order.deliveryFeeCents),

        orderTotal,
        orderTotalCents,

        totalPaid,
        totalPaidCents: paymentSuccessful ? orderTotalCents : null,

        rider: order.riderId
          ? {
              name: riderProfile?.user?.name ?? order.riderName ?? 'Your rider',
              phone: riderProfile?.phone ?? null,
              imageUrl: riderProfile?.photoUrl ?? null,
              vehicleType: riderProfile?.vehicleType ?? null,
              vehicleColor: riderProfile?.vehicleColor ?? null,
              plateNumber: riderProfile?.plateNumber ?? null,
              location: order.riderLocation ?? null,
            }
          : null,

        delivery: order.delivery ?? null,
        statusHistory: order.statusHistory ?? [],
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    );
  } catch (error) {
    console.error('[order-tracking] Failed to load order:', error);

    return NextResponse.json(
      { error: 'Unable to load order tracking information' },
      { status: 500 },
    );
  }
}
