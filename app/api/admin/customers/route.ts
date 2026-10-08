import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        orders: {
          select: {
            total: true,
          },
        },
      },
    });

    const formattedCustomers = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      orderCount: customer.orders.length,
      totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
      createdAt: customer.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
