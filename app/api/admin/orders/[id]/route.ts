import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/admin/orders/[id]
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: {
        id,
      },

      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },

        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

    const productSummary = order.items.map((item) => item.product.name).join(', ');

    const formattedOrder = {
      id: order.id,

      orderNumber: `CNC-${order.id.slice(-6).toUpperCase()}`,

      // --------------------------------------------------
      // ORDER INFORMATION
      // --------------------------------------------------
      status: order.status,
      paymentStatus: order.paymentStatus,

      createdAt: order.createdAt.toISOString(),

      // --------------------------------------------------
      // FINANCIALS
      // --------------------------------------------------
      total: order.total,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,

      // --------------------------------------------------
      // CUSTOMER
      // --------------------------------------------------
      customer: {
        id: order.customer.id,
        name: order.customer.name || 'Unknown',
        email: order.customer.email,
      },

      // Also expose these directly if your frontend
      // already uses the list API structure.
      customerName: order.customer.name || 'Unknown',
      customerEmail: order.customer.email,

      // --------------------------------------------------
      // ITEMS
      // --------------------------------------------------
      itemsCount,
      productSummary,

      items: order.items.map((item) => ({
        id: item.id,

        productId: item.product.id,
        productName: item.product.name,

        image: item.product.images?.[0] ?? null,
        images: item.product.images ?? [],

        quantity: item.quantity,

        pricePerUnit: item.pricePerUnit,

        tier: item.tier,
      })),

      // --------------------------------------------------
      // DELIVERY ADDRESS
      // --------------------------------------------------
      location: `${order.shippingCity}, ${order.shippingState}`,

      customerAddress: {
        address: order.shippingAddress,
        city: order.shippingCity,
        state: order.shippingState,
        zip: order.shippingZip,
        country: order.shippingCountry,
      },

      delivery: {
        address: order.shippingAddress,
        city: order.shippingCity,
        state: order.shippingState,
        zip: order.shippingZip,
        country: order.shippingCountry,

        zone: order.shippingCity,

        assignedRider: order.rider
          ? {
              id: order.rider.id,
              name: order.rider.name,
              phone: order.rider.phone,
              status: order.rider.status,
            }
          : null,
      },

      // --------------------------------------------------
      // RIDER
      // --------------------------------------------------
      rider: order.rider
        ? {
            id: order.rider.id,
            name: order.rider.name,
            phone: order.rider.phone,
            status: order.rider.status,
          }
        : null,

      // --------------------------------------------------
      // TRACKING / DELIVERY
      // --------------------------------------------------
      trackingNumber: order.trackingNumber,

      estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching admin order:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      {
        status: 500,
      }
    );
  }
}
