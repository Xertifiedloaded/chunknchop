import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import { prisma } from '@/lib/db';
import { ACTIVE_PRODUCT_FILTER } from '@/lib/products';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalOrders, totalCustomers, totalProducts, revenueResult, recentOrders] = await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: ACTIVE_PRODUCT_FILTER }),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totalOrders,
      totalRevenue: revenueResult._sum.total ?? 0,
      totalCustomers,
      totalProducts,
      recentOrders: recentOrders.map(({ customer, ...order }) => ({
        ...order,
        customerName: customer?.name || 'Unknown',
      })),
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}