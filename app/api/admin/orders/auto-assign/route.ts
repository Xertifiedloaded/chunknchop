import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';
import { pusher } from '@/lib/pusher';

// POST /api/admin/orders/auto-assign
// body: { orderIds: string[] }
// Attempts to find available STAFF users and send them processing assignments.
// If none are available, falls back to notifying packing team.
export async function POST(req: NextRequest) {
  try {
    const current = getUserFromRequest(req);
    if (!current || current.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderIds } = body;
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds required' }, { status: 400 });
    }

    // Find staff users (role = STAFF) - could be extended with availability flags
    const staff = await prisma.user.findMany({ where: { role: 'STAFF' }, select: { id: true, email: true, name: true } });

    // Update orders to PROCESSING to indicate they are being picked/packed
    const updated = await prisma.order.updateMany({ where: { id: { in: orderIds } }, data: { status: 'PROCESSING' } });

    const payload = { orderIds, timestamp: new Date().toISOString(), adminId: current.id };

    if (staff.length > 0) {
      // Notify staff channel with assignment payload
      await pusher.trigger('private-staff-assignments', 'orders-assigned', { ...payload, staff });
      return NextResponse.json({ success: true, assignedToStaff: true, staffCount: staff.length });
    } else {
      // No staff available -> notify packing immediately
      await pusher.trigger('private-packing', 'packing-required', payload);
      return NextResponse.json({ success: true, assignedToPacking: true });
    }
  } catch (error) {
    console.error('Auto-assign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
