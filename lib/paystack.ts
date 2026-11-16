import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { deleteMongoDocument } from '@/lib/mongo-collections';

export const PAYSTACK_CURRENCY = 'NGN';

export class PaystackConfigurationError extends Error {
  constructor() {
    super('Paystack is not configured. Add PAYSTACK_SECRET_KEY to enable online checkout.');
    this.name = 'PaystackConfigurationError';
  }
}

type PaystackApiResult<T> = { status?: boolean; message?: string; data?: T };
type PaystackTransaction = {
  status?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  id?: number;
};
type StoredOrder = {
  _id: string;
  userId?: string;
  subtotalCents?: number;
  paymentStatus?: string;
  paymentReference?: string;
};
type MongoCursor<T> = { cursor?: { firstBatch?: T[] } };

export function isPaystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());
}

function getSecretKey() {
  // trim() guards against stray spaces/newlines in the env value
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) throw new PaystackConfigurationError();
  return secret;
}

async function paystackFetch<T>(path: string, init?: RequestInit) {
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const result = (await response.json().catch(() => null)) as PaystackApiResult<T> | null;
  if (!response.ok || !result?.status || !result.data) {
    // Log the real reason server-side only. Never send this to the client.
    console.error('[paystack] request failed', {
      path,
      httpStatus: response.status,
      paystackMessage: result?.message ?? null,
    });
    throw new Error(
      'Paystack could not complete this request. Check your Paystack configuration and try again.',
    );
  }
  return result.data;
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountCents: number; // amount in kobo
  reference: string;
  orderNumber: string;
  callbackUrl: string;
}) {
  const data = await paystackFetch<{ authorization_url?: unknown; reference?: unknown }>(
    '/transaction/initialize',
    {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        amount: input.amountCents,
        currency: PAYSTACK_CURRENCY,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: { orderNumber: input.orderNumber },
      }),
    },
  );

  if (
    typeof data.authorization_url !== 'string' ||
    typeof data.reference !== 'string' ||
    data.reference !== input.reference
  ) {
    throw new Error('Paystack returned an invalid checkout session');
  }
  return { authorizationUrl: data.authorization_url };
}

export async function verifyAndRecordPaystackPayment(reference: string) {
  const result = await prisma.$runCommandRaw({
    find: 'StoreOrder',
    filter: { paymentReference: reference },
    limit: 1,
  });
  const order = (result as unknown as MongoCursor<StoredOrder>).cursor?.firstBatch?.[0];
  if (!order || typeof order.subtotalCents !== 'number')
    throw new Error('Order not found for this payment');
  if (order.paymentStatus === 'paid') return { orderNumber: order._id, paid: true };

  const transaction = await paystackFetch<PaystackTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  const isPaid =
    transaction.status === 'success' &&
    transaction.reference === reference &&
    transaction.amount === order.subtotalCents &&
    transaction.currency === PAYSTACK_CURRENCY;

  if (!isPaid) {
    const verifiedIdentity =
      transaction.reference === reference &&
      transaction.amount === order.subtotalCents &&
      transaction.currency === PAYSTACK_CURRENCY;
    if (verifiedIdentity && ['failed', 'abandoned'].includes(transaction.status ?? '')) {
      const failedAt = new Date().toISOString();
      await prisma.$runCommandRaw({
        update: 'StoreOrder',
        updates: [
          {
            q: { _id: order._id, paymentReference: reference, paymentStatus: { $ne: 'paid' } },
            u: {
              $set: {
                paymentStatus: 'failed',
                status: 'payment_failed',
                paymentFailedAt: failedAt,
              },
              $push: {
                statusHistory: {
                  status: 'payment_failed',
                  at: failedAt,
                  note: 'Payment was not completed',
                },
              },
            },
            upsert: false,
            multi: false,
          },
        ],
      });
    }
    return { orderNumber: order._id, paid: false };
  }

  const paidAt = new Date().toISOString();
  await prisma.$runCommandRaw({
    update: 'StoreOrder',
    updates: [
      {
        q: { _id: order._id, paymentReference: reference, paymentStatus: { $ne: 'paid' } },
        u: {
          $set: {
            paymentStatus: 'paid',
            status: 'paid',
            paidAt,
            paymentTransactionId: transaction.id ?? null,
          },
          $push: {
            statusHistory: { status: 'paid', at: paidAt, note: 'Payment confirmed by Paystack' },
          },
        },
        upsert: false,
        multi: false,
      },
    ],
  });

  const latestResult = await prisma.$runCommandRaw({
    find: 'StoreOrder',
    filter: { _id: order._id },
    limit: 1,
  });
  const latest = (latestResult as unknown as MongoCursor<StoredOrder>).cursor?.firstBatch?.[0];
  const paid = latest?.paymentStatus === 'paid';
  if (paid && order.userId)
    await deleteMongoDocument('UserCart', order.userId).catch(() => undefined);
  return { orderNumber: order._id, paid };
}

export function isValidPaystackWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret || !signature || !/^[a-f\d]{128}$/i.test(signature)) return false;
  const expected = createHmac('sha512', secret).update(rawBody).digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}