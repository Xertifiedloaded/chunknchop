import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const reference = req.nextUrl.searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'No transaction reference was provided.',
        },
        { status: 400 }
      );
    }

    /*
     * Find the order belonging to this customer.
     */
    const order = await prisma.order.findFirst({
      where: {
        paystackReference: reference,
        customerId: user.id,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Order not found for this payment reference.',
        },
        { status: 404 }
      );
    }

    /*
     * Verify the transaction directly with Paystack.
     */
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack verification failed:', paystackData);

      return NextResponse.json(
        {
          status: 'error',
          message: paystackData.message || 'Unable to verify the payment with Paystack.',
        },
        { status: 400 }
      );
    }

    const transaction = paystackData.data;

    /*
     * Make sure the amount paid matches the order total.
     *
     * Paystack uses kobo for NGN.
     */
    const expectedAmount = Math.round(order.total * 100);

    if (transaction.amount !== expectedAmount) {
      console.error('Payment amount mismatch', {
        orderId: order.id,
        expectedAmount,
        receivedAmount: transaction.amount,
      });

      return NextResponse.json(
        {
          status: 'error',
          message: 'The payment amount does not match the order total.',
        },
        { status: 400 }
      );
    }

    /*
     * Payment was successful.
     */
    if (transaction.status === 'success') {
      const updatedOrder = await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          paymentStatus: 'PAID',
        },
      });

      return NextResponse.json(
        {
          status: 'success',
          reference: transaction.reference,
          orderId: updatedOrder.id,
          total: Number(updatedOrder.total),
          paidAt: transaction.paid_at ?? null,
          channel: transaction.channel ?? null,
        },
        { status: 200 }
      );
    }

    /*
     * Paystack knows about the transaction, but it wasn't successful.
     */
    return NextResponse.json(
      {
        status: 'failed',
        reference: transaction.reference,
        orderId: order.id,
        message: transaction.gateway_response || transaction.message || 'The payment was not successful.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/customer/orders/verify]', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Something went wrong while verifying your payment.',
      },
      { status: 500 }
    );
  }
}
