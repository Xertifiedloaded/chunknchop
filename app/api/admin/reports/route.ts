import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const period = request.nextUrl.searchParams.get('period') || 'monthly';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Total orders
    const totalOrders = await prisma.order.count({
      where: { createdAt: { gte: startDate } },
    });

    // Total revenue
    const revenueData = await prisma.order.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { total: true },
    });

    const totalRevenue = revenueData._sum.total || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // New customers
    const newCustomers = await prisma.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: { gte: startDate },
      },
    });

    // Top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { createdAt: { gte: startDate } },
      },
      _sum: { quantity: true, pricePerUnit: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    // Get product names
    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        });
        return {
          name: product?.name || 'Unknown',
          sold: item._sum.quantity || 0,
          revenue: (item._sum.pricePerUnit || 0) * (item._sum.quantity || 1),
        };
      })
    );

    // Sales by meat type
    const salesByMeatType = await prisma.orderItem.groupBy({
      by: [],
      where: {
        order: { createdAt: { gte: startDate } },
      },
      _sum: { pricePerUnit: true },
    });

    // Orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

    return NextResponse.json({
      period,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      totalCustomers: 0,
      newCustomers,
      topProducts: topProductsWithNames,
      salesByMeatType: [],
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
