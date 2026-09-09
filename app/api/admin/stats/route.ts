import { NextRequest, NextResponse } from 'next/server';

import { getUserFromRequest } from '@/lib/request';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const totalOrders = await prisma.order.count();
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalProducts = await prisma.product.count();

    const revenueResult = await prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { total: true },
    });
    const totalRevenue = revenueResult._sum.total || 0;

    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        total: true,
        status: true,
        createdAt: true,
        customer: {
          select: { name: true },
        },
      },
    });

    const formattedRecentOrders = recentOrders.map((order) => ({
      ...order,
      customerName: order.customer.name || 'Unknown',
    }));

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      recentOrders: formattedRecentOrders,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
