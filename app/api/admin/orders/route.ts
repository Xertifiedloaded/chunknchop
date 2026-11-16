import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { findMongoDocuments } from '@/lib/mongo-collections';

type StoredOrder = Record<string, unknown> & { _id: string };

export async function GET() {
  const access = await requireAdminApi();
  if (access.response) return access.response;

  const orders = await findMongoDocuments<StoredOrder>('StoreOrder', {}, 100);
  return NextResponse.json(
    {
      orders: orders.map(
        ({
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
