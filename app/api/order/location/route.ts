import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { pusher } from '@/lib/pusher';
import { z } from 'zod';

const schema = z.object({
  orderId: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  bearing: z.number().optional(),
  speed: z.number().optional(),
});

// POST /api/order/location — accept order live location (typically sent by rider)
// and broadcast via Pusher to order-specific and customer channels. Not persisted
// to DB to keep changes minimal — consumers subscribe to Pusher for live updates.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, latitude, longitude, bearing, speed } = schema.parse(body);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const payload = {
      orderId,
      latitude,
      longitude,
      bearing: bearing ?? null,
      speed: speed ?? null,
      timestamp: new Date().toISOString(),
      riderId: order.riderId ?? null,
    };

    // Broadcast live location to order-{orderId} and to the customer's orders channel
    await pusher.trigger(`private-order-${orderId}`, 'location-update', payload);
    if (order.customerId) {
      await pusher.trigger(`private-user-${order.customerId}-orders`, 'order-location', payload);
    }

    // Also broadcast to admin channel for monitoring
    await pusher.trigger('private-admin-orders', 'order-location', payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order location error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
