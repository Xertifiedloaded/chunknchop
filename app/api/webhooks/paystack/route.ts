import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('PAYSTACK_SECRET_KEY is not set');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  const expectedSignature = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');

  const signatureValid = !!signature && signature.length === expectedSignature.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!signatureValid) {
    console.error('Invalid Paystack webhook signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    switch (event.event) {
      case 'charge.success': {
        const reference: string = event.data.reference;
        const verified = await paystack.verifyTransaction(reference);
        const transaction = verified.data;

        if (transaction.status !== 'success') {
          break;
        }

        const order = await prisma.order.findUnique({ where: { paystackReference: reference } });
        if (!order) {
          console.error('Webhook: no order found for reference', reference);
          break;
        }

        if (order.paymentStatus === 'PAID') {
          break;
        }

        const expectedAmount = Math.round(Number(order.total) * 100);
        if (transaction.amount !== expectedAmount) {
          console.error('Webhook amount mismatch — order not marked paid, needs review', {
            orderId: order.id,
            expectedAmount,
            receivedAmount: transaction.amount,
          });
          break;
        }
        const updateResult = await prisma.order.updateMany({
          where: { id: order.id, paymentStatus: { not: 'PAID' } },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING',
            paidAt: new Date(),
          },
        });

        if (updateResult.count === 0) {
          break;
        }

        const auth = transaction.authorization;
        const userId = transaction.metadata?.userId;

        if (auth?.reusable && userId) {
          await prisma.paymentMethod.upsert({
            where: { paystackAuthorizationCode: auth.authorization_code },
            update: { isActive: true },
            create: {
              userId,
              type: 'CARD',
              cardLast4: auth.last4,
              cardBrand: auth.card_type,
              cardExpiry: auth.exp_month && auth.exp_year ? `${auth.exp_month}/${String(auth.exp_year).slice(-2)}` : undefined,
              paystackAuthorizationCode: auth.authorization_code,
              paystackCustomerCode: transaction.customer?.customer_code,
              isActive: true,
            },
          });
        }

        break;
      }

      case 'charge.failed': {
        const reference: string = event.data.reference;
        const order = await prisma.order.findUnique({ where: { paystackReference: reference } });

        if (order && order.paymentStatus !== 'PAID') {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'FAILED' },
          });
        }
        break;
      }

      default:
        console.warn('Webhook: unhandled event', event.event);
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/webhooks/paystack]', error);
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }
}
