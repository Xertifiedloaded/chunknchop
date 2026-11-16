import { NextResponse } from 'next/server';
import { isValidPaystackWebhookSignature, verifyAndRecordPaystackPayment } from '@/lib/paystack';

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!isValidPaystackWebhookSignature(rawBody, request.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let event: { event?: unknown; data?: { reference?: unknown } };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }

  if (event.event === 'charge.success' && typeof event.data?.reference === 'string') {
    try {
      await verifyAndRecordPaystackPayment(event.data.reference);
    } catch {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 502 });
    }
  }

  return NextResponse.json({ received: true });
}
