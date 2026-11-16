import { NextResponse } from 'next/server';
import { verifyAndRecordPaystackPayment } from '@/lib/paystack';

const ORDER_NUMBER = /^CNC-[A-F\d]{32}$/i;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get('order') ?? '';
  const reference = url.searchParams.get('reference') ?? '';
  const destination = (payment: string) =>
    NextResponse.redirect(
      new URL(`/account/orders/${encodeURIComponent(orderNumber)}?payment=${payment}`, url.origin),
      303,
    );

  if (!ORDER_NUMBER.test(orderNumber) || !reference) return destination('failed');

  try {
    const result = await verifyAndRecordPaystackPayment(reference);
    if (result.orderNumber !== orderNumber) return destination('failed');
    return destination(result.paid ? 'success' : 'failed');
  } catch {
    return destination('failed');
  }
}
