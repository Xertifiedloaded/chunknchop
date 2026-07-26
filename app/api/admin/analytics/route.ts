import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Total revenue
    const revenueResult = await prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { total: true },
    });
    const totalRevenue = revenueResult._sum.total || 0;

    // Total orders
    const totalOrders = await prisma.order.count({ where: { paymentStatus: 'PAID' } });
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { pricePerUnit: true },
      _count: { id: true },
      take: 5,
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        });
        return {
          name: product?.name || 'Unknown',
          sales: item._count.id,
          revenue: item._sum.pricePerUnit || 0,
        };
      })
    );

    // Sales by meat type
    const salesByMeatType = await prisma.product.groupBy({
      by: ['meatType'],
      _sum: { basePrice: true },
      _count: { id: true },
    });

    const totalByMeat = salesByMeatType.reduce((sum, item) => sum + (item._sum.basePrice || 0), 0);

    const formattedSalesByMeat = salesByMeatType.map((item) => ({
      meatType: item.meatType,
      revenue: item._sum.basePrice || 0,
      percentage: totalByMeat > 0 ? ((item._sum.basePrice || 0) / totalByMeat) * 100 : 0,
    }));

    // Conversion rate (placeholder)
    const totalVisits = 1000; // This would come from analytics
    const conversionRate = totalOrders > 0 ? (totalOrders / totalVisits) * 100 : 0;

    return NextResponse.json({
      totalRevenue,
      averageOrderValue,
      conversionRate: conversionRate.toFixed(2),
      topProducts: topProductsWithDetails,
      salesByMeatType: formattedSalesByMeat,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
