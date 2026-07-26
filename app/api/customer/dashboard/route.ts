import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Total orders
    const totalOrders = await prisma.order.count({
      where: { customerId: user.id },
    });

    // Total spent
    const orderStats = await prisma.order.aggregate({
      where: { customerId: user.id },
      _sum: { total: true },
    });

    // Active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        customerId: user.id,
        status: 'ACTIVE',
      },
    });

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: { customerId: user.id },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      totalOrders,
      totalSpent: orderStats._sum.total || 0,
      activeSubscriptions,
      recentOrders: recentOrders.map((order) => ({
        ...order,
        totalAmount: Number(order.totalAmount),
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
