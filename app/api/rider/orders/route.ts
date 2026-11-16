import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin-api';
import { findMongoDocuments } from '@/lib/mongo-collections';

type StoredOrder = Record<string, unknown> & { _id: string };

export async function GET() {
  const session = await getSession(await headers());
  if (!session?.user)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (session.user.role !== 'rider' && !isAdminUser(session.user)) {
    return NextResponse.json({ error: 'Rider access required' }, { status: 403 });
  }

  const orders = await findMongoDocuments<StoredOrder>(
    'StoreOrder',
    { riderId: session.user.id },
    100,
  );
  return NextResponse.json(
    {
      orders: orders.map(
        ({
          userId: _userId,
          email: _email,
          riderId: _riderId,
          riderEmail: _riderEmail,
          paymentReference: _paymentReference,
          paymentTransactionId: _paymentTransactionId,
          authorizationUrl: _authorizationUrl,
          checkoutRequestId: _checkoutRequestId,
          ...order
        }) => ({
          ...order,
          orderNumber: order._id,
        }),
      ),
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
