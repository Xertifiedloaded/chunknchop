import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';

// admin orders
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      include: {
        customer: {
          select: { name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { name: true, images: true },
            },
          },
        },
        rider: {
          select: { id: true, name: true, phone: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedOrders = orders.map((order) => {
      const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const productSummary = order.items.map((item) => item.product.name).join(', ');

      return {
        id: order.id,
        orderNumber: `CNC-${order.id.slice(-6).toUpperCase()}`,
        total: order.total,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt.toISOString(),

        customerName: order.customer.name || 'Unknown',
        customerEmail: order.customer.email,

        itemsCount,
        productSummary,
        items: order.items.map((item) => ({
          productName: item.product.name,
          image: item.product.images?.[0] ?? null,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          tier: item.tier,
        })),

        location: `${order.shippingCity}, ${order.shippingState}`,
        customerAddress: {
          address: order.shippingAddress,
          city: order.shippingCity,
          state: order.shippingState,
          zip: order.shippingZip,
          country: order.shippingCountry,
        },

        trackingNumber: order.trackingNumber,
        estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,

        rider: order.rider
          ? {
              id: order.rider.id,
              name: order.rider.name,
              phone: order.rider.phone,
              status: order.rider.status,
            }
          : null,
      };
    });

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
