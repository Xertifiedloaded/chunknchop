import { NextRequest, NextResponse } from 'next/server';
import { pusher } from '@/lib/pusher';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { socket_id, channel_name } = body;

    if (!socket_id || !channel_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Authorize subscriptions for different private channel types:
    // - private-user-<userId> : customer user
    // - private-rider-<riderId> : rider
    // - private-order-<orderId> : customer OR assigned rider OR admin

    if (channel_name.startsWith('private-user-')) {
      if (!channel_name.includes(user.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (channel_name.startsWith('private-rider-')) {
      // allow if token represents a rider with matching id
      if (!(user.role === 'RIDER' || user.rider === true) || !channel_name.includes(user.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (channel_name.startsWith('private-order-')) {
      // Extract order id and allow if the requester is the customer, assigned rider, or admin
      const orderId = channel_name.replace('private-order-', '');
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

      const isCustomer = user.role === 'CUSTOMER' && order.customerId === user.id;
      const isRider = (user.role === 'RIDER' || user.rider === true) && order.riderId === user.id;
      const isAdmin = user.role === 'ADMIN';

      if (!isCustomer && !isRider && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Authenticate the subscription
    const auth = pusher.authenticateUser(socket_id, {
      id: user.id,
      info: {
        email: (user as any).email || null,
      },
    });

    return NextResponse.json(auth);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
