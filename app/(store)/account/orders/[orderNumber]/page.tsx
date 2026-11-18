import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Clock3,
  AlertTriangle,
  ArrowRight,
  Package,
  ShieldCheck,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';

import { getSession } from '@/lib/auth';

type PageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
  searchParams: Promise<{
    payment?: string;
  }>;
};

export const metadata: Metadata = {
  title: 'Payment Status | ChunkNChop',
  description: 'View your ChunkNChop payment status.',
};

const paymentStyles = {
  green: {
    iconBg: 'bg-[#edf5e9]',
    iconColor: 'text-[#54834b]',
    badge: 'bg-[#edf5e9] text-[#47743b]',
    top: 'bg-[#568447]',
  },
  red: {
    iconBg: 'bg-[#fbefed]',
    iconColor: 'text-[#b64b3d]',
    badge: 'bg-[#fbefed] text-[#a9442c]',
    top: 'bg-[#b64b3d]',
  },
  orange: {
    iconBg: 'bg-[#fff5e8]',
    iconColor: 'text-[#bd8235]',
    badge: 'bg-[#fff5e8] text-[#a66b24]',
    top: 'bg-[#d39a43]',
  },
} as const;

type PaymentColor = keyof typeof paymentStyles;

type PaymentState = {
  title: string;
  label: string;
  description: string;
  color: PaymentColor;
  icon: typeof CheckCircle2;
};

const paymentStates: Record<string, PaymentState> = {
  success: {
    title: 'Payment Successful',
    label: 'Payment confirmed',
    description:
      'Your payment has been confirmed successfully. Thank you for shopping with ChunkNChop. We will take care of the rest.',
    color: 'green',
    icon: CheckCircle2,
  },
  failed: {
    title: 'Payment Failed',
    label: 'Payment unsuccessful',
    description:
      'Unfortunately, your payment could not be completed. Please check your payment details or try another payment method.',
    color: 'red',
    icon: XCircle,
  },
  declined: {
    title: 'Payment Declined',
    label: 'Transaction declined',
    description:
      'Your bank or payment provider declined this transaction. Please contact your bank or use another payment method.',
    color: 'red',
    icon: XCircle,
  },
  cancelled: {
    title: 'Payment Cancelled',
    label: 'Transaction cancelled',
    description:
      'You cancelled the payment before it was completed. Your order reference is saved. You can return to your orders to continue.',
    color: 'orange',
    icon: AlertTriangle,
  },
  pending: {
    title: 'Payment Pending',
    label: 'Awaiting confirmation',
    description:
      'Your payment is being processed. Please allow some time for confirmation. Avoid making another payment until you check your transaction status.',
    color: 'orange',
    icon: Clock3,
  },
  processing: {
    title: 'Payment Processing',
    label: 'Transaction processing',
    description:
      'Your payment is currently being processed by your payment provider. We will update your order when confirmation is received.',
    color: 'orange',
    icon: RefreshCw,
  },
};

const statusAliases: Record<string, string> = {
  success: 'success',
  successful: 'success',
  paid: 'success',
  completed: 'success',

  failed: 'failed',
  failure: 'failed',
  error: 'failed',

  declined: 'declined',
  rejected: 'declined',

  cancelled: 'cancelled',
  canceled: 'cancelled',

  pending: 'pending',
  processing: 'processing',
};

export default async function OrderPaymentPage({ params, searchParams }: PageProps) {
  const [{ orderNumber }, query] = await Promise.all([params, searchParams]);

  const session = await getSession(await headers());

  if (!session?.user) {
    redirect(
      `/sign-in?returnTo=${encodeURIComponent(
        `/account/orders/${orderNumber}?payment=${query.payment ?? ''}`,
      )}`,
    );
  }

  const normalizedStatus = (query.payment ?? 'pending').toLowerCase().trim();

  const status = statusAliases[normalizedStatus] ?? 'pending';

  const payment = paymentStates[status] ?? paymentStates.pending;
  const StatusIcon = payment.icon;

  const isSuccess = status === 'success';

  const styles = paymentStyles[payment.color] || paymentStyles.orange;

  return (
    <main className="flex min-h-[85vh] items-center justify-center bg-[#faf9f6] px-4 py-10 sm:px-6">
      <section className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-[#eeeae2] bg-white shadow-[0_8px_35px_rgba(40,35,20,0.05)]">
        <div className={`h-1 ${styles.top}`} />

        <div className="px-5 py-8 text-center sm:px-9 sm:py-10">
          <div
            className={`mx-auto mb-5 flex size-[68px] items-center justify-center rounded-full ${styles.iconBg}`}
          >
            <StatusIcon size={34} strokeWidth={1.6} className={styles.iconColor} />
          </div>

          <div className="mb-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] ${styles.badge}`}
            >
              {isSuccess ? <ShieldCheck size={12} /> : <StatusIcon size={12} />}
              {payment.label}
            </span>
          </div>

          <h1 className="text-[23px] font-semibold tracking-[-0.6px] text-[#292820] sm:text-[26px]">
            {payment.title}
          </h1>

          <p className="mx-auto mt-3 max-w-[340px] text-[12px] leading-[1.9] text-[#858078] sm:text-[13px]">
            {payment.description}
          </p>

          <div className="my-7 rounded-xl border border-dashed border-[#e5e1d9] bg-[#faf9f6] px-4 py-4">
            <div className="mb-2 flex items-center justify-center gap-1.5 text-[#969188]">
              <Package size={13} />
              <span className="text-[9px] font-semibold uppercase tracking-[0.13em]">
                Order reference
              </span>
            </div>

            <p className="break-all text-[12px] font-semibold tracking-[0.3px] text-[#39362f]">
              {orderNumber}
            </p>
          </div>

          <Link
            href={`/account/orders/${orderNumber}/track`}
            className={`group flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 text-[12px] font-semibold text-white transition duration-200 focus:outline-none focus:ring-4 ${
              isSuccess
                ? 'bg-[#a9442c] hover:bg-[#913923] focus:ring-[#a9442c]/15'
                : 'bg-[#39362f] hover:bg-[#292820] focus:ring-[#39362f]/15'
            }`}
          >
            <Package size={15} />
            {isSuccess ? 'Track My Order' : 'View My Order'}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/account/orders"
            className="mt-3 inline-flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium text-[#817c73] transition hover:text-[#a9442c]"
          >
            <ShoppingBag size={13} />
            My Orders
          </Link>

          <div className="mt-7 border-t border-[#f0eee9] pt-5">
            <p className="text-[10px] leading-[1.8] text-[#a09b92]">
              Need assistance? Contact ChunkNChop support with your order reference.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
