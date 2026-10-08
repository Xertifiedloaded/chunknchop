import { NextRequest, NextResponse } from 'next/server';
import { pusher } from '@/lib/pusher';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update order in database
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // Send real-time notification via Pusher
    await pusher.trigger(`order-${orderId}`, 'status-update', {
      orderId,
      status,
      timestamp: new Date().toISOString(),
    });

    // Broadcast to all user's orders channel
    await pusher.trigger(`user-${order.customerId}-orders`, 'order-updated', {
      orderId,
      status,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
