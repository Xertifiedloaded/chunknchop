'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Clock3,
  CreditCard,
  Hash,
  MapPin,
  ShoppingBag,
  Truck,
  Box,
  LoaderCircle,
  ArrowRight,
  XCircle,
  AlertCircle,
} from 'lucide-react';

type Props = {
  orderNumber: string;
  paymentStatus: string;
};

type Delivery = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  state?: string;
  postalCode?: string;
  fullName?: string;
  deliveryWindow?: string;
  deliveryDate?: string;
  estimatedDelivery?: string;
};

type StatusHistoryItem = {
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
  date?: string;
  at?: string;
};

type Tracking = {
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentProvider?: string;
  paymentChannel?: string;
  createdAt?: string;
  placedAt?: string;
  estimatedDelivery?: string;
  deliveryWindow?: string;
  delivery?: Delivery | null;
  statusHistory?: StatusHistoryItem[];
};

type PaymentState = 'success' | 'pending' | 'failed' | 'declined' | 'cancelled';

const stages = [
  {
    key: 'payment_pending',
    label: 'Order Received',
    icon: Check,
  },
  {
    key: 'paid',
    label: 'Preparing',
    icon: ShoppingBag,
  },
  {
    key: 'assigned',
    label: 'Packaging',
    icon: Box,
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: Truck,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: MapPin,
  },
];

const statusAliases: Record<string, number> = {
  payment_pending: 0,
  pending: 0,
  paid: 1,
  success: 1,
  successful: 1,
  completed: 1,
  confirmed: 1,
  preparing: 1,
  assigned: 2,
  packaging: 2,
  picked_up: 3,
  out_for_delivery: 3,
  delivered: 4,
};

const successfulPaymentStatuses = ['success', 'successful', 'paid', 'completed'];

const pendingPaymentStatuses = [
  'pending',
  'payment_pending',
  'processing',
  'initiated',
  'ongoing',
  'awaiting_payment',
  'awaiting_confirmation',
];

const failedPaymentStatuses = ['failed', 'failure', 'rejected', 'abandoned', 'error'];

const declinedPaymentStatuses = ['declined', 'payment_declined'];

const cancelledStatuses = ['cancelled', 'canceled'];

function normalizeStatus(status?: string) {
  return (status ?? '').toLowerCase().trim().replaceAll(' ', '_').replaceAll('-', '_');
}

function getPaymentState(paymentStatus?: string, orderStatus?: string): PaymentState {
  const payment = normalizeStatus(paymentStatus);
  const order = normalizeStatus(orderStatus);

  if (cancelledStatuses.includes(payment) || cancelledStatuses.includes(order)) {
    return 'cancelled';
  }

  if (declinedPaymentStatuses.includes(payment) || declinedPaymentStatuses.includes(order)) {
    return 'declined';
  }

  if (failedPaymentStatuses.includes(payment) || failedPaymentStatuses.includes(order)) {
    return 'failed';
  }

  if (successfulPaymentStatuses.includes(payment)) {
    return 'success';
  }

  if (pendingPaymentStatuses.includes(payment)) {
    return 'pending';
  }

  if (successfulPaymentStatuses.includes(order)) {
    return 'success';
  }

  if (
    [
      'confirmed',
      'preparing',
      'assigned',
      'packaging',
      'picked_up',
      'out_for_delivery',
      'delivered',
    ].includes(order)
  ) {
    return 'success';
  }

  if (pendingPaymentStatuses.includes(order)) {
    return 'pending';
  }

  return 'pending';
}

function getStageIndex(status?: string) {
  return statusAliases[normalizeStatus(status)] ?? 0;
}

function formatTime(value?: string) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPlacedDate(value?: string) {
  if (!value) return 'Order received';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Order received';

  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const dateLabel = isToday
    ? 'Today'
    : date.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  return `${dateLabel}, ${formatTime(value)}`;
}

function getAddress(delivery?: Delivery | null) {
  if (!delivery) return [];

  return [
    delivery.addressLine1,
    delivery.addressLine2,
    [delivery.city, delivery.region || delivery.state].filter(Boolean).join(', '),
    delivery.postalCode,
  ].filter(Boolean);
}

function getPaymentMethod(data: Tracking) {
  const method = data.paymentMethod || data.paymentChannel || data.paymentProvider;

  if (!method) return 'Online payment';

  return method.replaceAll('_', ' ');
}

function getEstimatedDelivery(data: Tracking) {
  return (
    data.estimatedDelivery ||
    data.delivery?.estimatedDelivery ||
    data.delivery?.deliveryWindow ||
    data.delivery?.deliveryDate ||
    'Awaiting delivery estimate'
  );
}

function getHistoryTime(history: StatusHistoryItem[], status: string) {
  const entry = history.find((item) => normalizeStatus(item.status) === status);

  return formatTime(
    entry?.createdAt || entry?.updatedAt || entry?.timestamp || entry?.date || entry?.at,
  );
}

function SummaryCard({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Hash;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-[#e9e7e3] bg-white px-3 py-3.5 sm:px-4 sm:py-4">
      <div className="mb-2.5 flex items-center gap-1.5 text-[#7d8491]">
        <Icon size={11} strokeWidth={1.8} />

        <span className="text-[8px] font-semibold uppercase tracking-[0.09em] sm:text-[9px]">
          {label}
        </span>
      </div>

      {children}
    </div>
  );
}

export default function OrderConfirmation({ orderNumber, paymentStatus }: Props) {
  const [data, setData] = useState<Tracking>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadOrder() {
      setLoading(true);
      setLoadError('');
      setData({});

      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/tracking`, {
          cache: 'no-store',
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || 'Unable to load order information.');
        }

        if (active) {
          setData(result.order ?? result);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : 'Unable to load order information.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadOrder();

    return () => {
      active = false;
    };
  }, [orderNumber]);

  const currentStatus = normalizeStatus(data.status || paymentStatus);

  const effectivePaymentStatus = data.paymentStatus || paymentStatus;

  const paymentState = getPaymentState(effectivePaymentStatus, data.status);

  const paymentIsSuccessful = paymentState === 'success';
  const paymentIsPending = paymentState === 'pending';
  const paymentHasFailed = paymentState === 'failed';
  const paymentWasDeclined = paymentState === 'declined';
  const orderIsCancelled = paymentState === 'cancelled';

  const isConfirmed = paymentIsSuccessful;

  const currentStage = getStageIndex(data.status || paymentStatus);

  const showDeliveryProgress = paymentIsSuccessful;

  const delivery = data.delivery;
  const addressLines = getAddress(delivery);
  const history = data.statusHistory ?? [];

  const placedAt = data.placedAt || data.createdAt;

  const paymentMethod = getPaymentMethod(data);
  const estimatedDelivery = getEstimatedDelivery(data);

  const timelineTimes = [
    getHistoryTime(history, 'payment_pending') ||
      getHistoryTime(history, 'pending') ||
      formatTime(placedAt),

    getHistoryTime(history, 'paid') || getHistoryTime(history, 'preparing'),

    getHistoryTime(history, 'assigned'),

    getHistoryTime(history, 'out_for_delivery') || getHistoryTime(history, 'picked_up'),

    getHistoryTime(history, 'delivered'),
  ];

  const timelineDescriptions = [
    timelineTimes[0] ? `Today, ${timelineTimes[0]}` : 'Order received',

    timelineTimes[1] ? `Today, ${timelineTimes[1]}` : 'Preparing your order',

    timelineTimes[2] ? `Today, ${timelineTimes[2]}` : 'Estimated time pending',

    timelineTimes[3] ? `Today, ${timelineTimes[3]}` : 'Estimated time pending',

    timelineTimes[4] ? `Today, ${timelineTimes[4]}` : 'Estimated time pending',
  ];

  const confirmationTitle = orderIsCancelled
    ? 'Order Cancelled'
    : paymentWasDeclined
      ? 'Payment Declined'
      : paymentHasFailed
        ? 'Payment Failed'
        : paymentIsPending
          ? 'Payment Pending'
          : 'Order Confirmed!';

  const confirmationMessage = orderIsCancelled
    ? 'This order has been cancelled. If you believe this is a mistake, please contact our support team.'
    : paymentWasDeclined
      ? 'Your payment was declined. Please try another payment method or contact your bank for assistance.'
      : paymentHasFailed
        ? 'We could not complete your payment. Please try again or use another payment method.'
        : paymentIsPending
          ? 'Your order has been received. We are waiting for payment confirmation before processing your order.'
          : "Thank you for shopping with ChunkNChop. We're preparing your order.";

  const paymentLabel = orderIsCancelled
    ? 'Order cancelled'
    : paymentWasDeclined
      ? 'Payment declined'
      : paymentHasFailed
        ? 'Payment failed'
        : paymentIsPending
          ? 'Awaiting payment confirmation'
          : 'Payment successful';

  const paymentColor = paymentIsSuccessful
    ? 'text-emerald-600'
    : paymentIsPending
      ? 'text-amber-600'
      : 'text-red-600';

  const HeaderIcon = paymentIsSuccessful
    ? Check
    : paymentIsPending
      ? Clock3
      : orderIsCancelled
        ? XCircle
        : AlertCircle;

  const headerIconBackground = paymentIsSuccessful
    ? 'bg-brand'
    : paymentIsPending
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <main className="min-h-screen bg-[#faf9f7] px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-222.5">
        {}
        <section className="flex flex-col items-center text-center">
          <div
            className={`relative mb-3 flex size-18 items-center justify-center rounded-full ${
              paymentIsSuccessful ? 'bg-[#fff1e9]' : paymentIsPending ? 'bg-amber-50' : 'bg-red-50'
            }`}
          >
            <div
              className={`flex size-14 items-center justify-center rounded-full text-white shadow-sm ${headerIconBackground}`}
            >
              <HeaderIcon size={25} strokeWidth={2.2} />
            </div>
          </div>

          <h1 className="text-[25px] font-bold tracking-[-0.8px] text-[#202020] sm:text-[29px]">
            {confirmationTitle}
          </h1>

          <p className="mt-1.5 max-w-85 text-[10px] leading-[1.7] text-[#737987] sm:text-[11px]">
            {confirmationMessage}
          </p>

          {}
          <div
            className={`mt-4 flex max-w-full items-center gap-2 rounded-md px-3 py-2 text-[9px] font-semibold ${
              paymentIsSuccessful
                ? 'bg-emerald-50 text-emerald-700'
                : paymentIsPending
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-red-50 text-red-700'
            }`}
          >
            {paymentIsSuccessful ? (
              <CheckCircleIcon />
            ) : paymentIsPending ? (
              <Clock3 size={12} />
            ) : (
              <AlertCircle size={12} />
            )}

            <span>{paymentLabel}</span>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {paymentIsSuccessful && (
              <Link
                href={`/account/orders/${encodeURIComponent(orderNumber)}/track`}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-brand px-4 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#d95c32]"
              >
                <Truck size={12} />
                Track Order
              </Link>
            )}

            {(paymentHasFailed || paymentWasDeclined) && (
              <Link
                href="/checkout"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-brand px-4 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#d95c32]"
              >
                <CreditCard size={12} />
                Try Again
              </Link>
            )}

            <Link
              href="/shop"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#e9e7e3] bg-white px-4 text-[10px] font-medium text-[#292722] transition hover:bg-[#f8f6f3]"
            >
              Continue Shopping
              <ArrowRight size={12} />
            </Link>
          </div>
        </section>

        {}
        <section className="mt-8 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard icon={Hash} label="Order Number">
            <p className="text-[11px] font-bold text-[#262626]" title={orderNumber}>
              {orderNumber.length > 12 ? `${orderNumber.slice(0, 12)}...` : orderNumber}
            </p>

            <p className="mt-1 text-[8px] text-[#7c8491]">
              {loading ? (
                <span className="inline-flex items-center gap-1">
                  <LoaderCircle size={10} className="animate-spin" />
                  Loading order date
                </span>
              ) : (
                `Placed ${formatPlacedDate(placedAt)}`
              )}
            </p>
          </SummaryCard>

          <SummaryCard icon={CreditCard} label="Payment Method">
            <p className="truncate text-[11px] font-bold capitalize text-[#262626]">
              {loading ? 'Loading...' : paymentMethod}
            </p>

            <p className={`mt-1 text-[8px] font-medium ${paymentColor}`}>
              {loading ? 'Checking payment...' : paymentLabel}
            </p>
          </SummaryCard>

          <SummaryCard icon={Clock3} label="Estimated Delivery">
            <p className="text-[11px] font-bold text-[#262626]">
              {loading
                ? 'Loading...'
                : paymentIsSuccessful
                  ? estimatedDelivery
                  : 'Not available yet'}
            </p>

            <p className="mt-1 text-[8px] text-[#7c8491]">
              {paymentIsSuccessful ? 'Same-day cold-chain' : 'Available after payment confirmation'}
            </p>
          </SummaryCard>

          <SummaryCard icon={MapPin} label="Delivery Address">
            <p className="truncate text-[11px] font-bold text-[#262626]">
              {loading ? 'Loading address...' : addressLines[0] || 'Address unavailable'}
            </p>

            <p className="mt-1 truncate text-[8px] text-[#7c8491]">
              {addressLines.slice(1).join(', ') || ' '}
            </p>
          </SummaryCard>
        </section>

        {}
        <section className="mt-5 rounded-lg border border-[#e9e7e3] bg-white px-4 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.015)] sm:px-5 sm:py-5">
          <div className="mb-7">
            <h2 className="text-[13px] font-bold text-[#292929]">
              {paymentIsSuccessful ? 'Delivery timeline' : 'Order status'}
            </h2>

            <p className="mt-1 text-[9px] text-[#7c8491]">
              {paymentIsSuccessful
                ? 'Cold-chain tracked from our facility to your door.'
                : paymentIsPending
                  ? 'Your order will be processed once payment is confirmed.'
                  : 'Delivery tracking will be available after successful payment.'}
            </p>
          </div>

          {!paymentIsSuccessful ? (
            <div
              className={`flex items-start gap-3 rounded-md px-3 py-3 ${
                paymentIsPending ? 'bg-amber-50' : 'bg-red-50'
              }`}
            >
              {paymentIsPending ? (
                <Clock3 size={16} className="mt-0.5 shrink-0 text-amber-600" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
              )}

              <div>
                <p
                  className={`text-[10px] font-semibold ${
                    paymentIsPending ? 'text-amber-800' : 'text-red-800'
                  }`}
                >
                  {orderIsCancelled
                    ? 'This order has been cancelled'
                    : paymentWasDeclined
                      ? 'Your payment was declined'
                      : paymentHasFailed
                        ? 'Payment was unsuccessful'
                        : 'Waiting for payment confirmation'}
                </p>

                <p
                  className={`mt-1 text-[9px] leading-5 ${
                    paymentIsPending ? 'text-amber-700' : 'text-red-700'
                  }`}
                >
                  {orderIsCancelled
                    ? 'No further delivery updates are available for this order.'
                    : paymentWasDeclined
                      ? 'Your bank or payment provider declined the transaction. You can try again with another payment method.'
                      : paymentHasFailed
                        ? 'The transaction could not be completed. Please try again or contact support if you have been debited.'
                        : 'Once your payment is confirmed, we will begin preparing your order and update your delivery progress here.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative px-1 sm:px-2">
              {}
              <div className="absolute top-3.75 right-[5.5%] left-[5.5%] h-px bg-[#e5e7eb]" />

              {}
              <div
                className="absolute top-3.75 left-[5.5%] h-px bg-brand transition-all duration-700"
                style={{
                  width: `${(currentStage / 4) * 89}%`,
                }}
              />

              <div className="relative grid grid-cols-5 gap-1">
                {stages.map((stage, index) => {
                  const complete = index < currentStage;
                  const active = index === currentStage;
                  const Icon = stage.icon;

                  return (
                    <div key={stage.key} className="flex min-w-0 flex-col items-center text-center">
                      <div
                        className={`relative z-10 flex size-7.5 items-center justify-center rounded-full transition-all duration-300 ${
                          complete || active
                            ? 'bg-brand text-white shadow-[0_2px_5px_rgba(237,112,68,0.2)]'
                            : 'border border-[#e8e9ed] bg-[#f2f3f6] text-[#a5adbb]'
                        } ${active ? 'ring-[3px] ring-brand/15' : ''}`}
                      >
                        <Icon size={13} strokeWidth={2} />
                      </div>

                      <p
                        className={`mt-2 max-w-22.5 text-[8px] font-semibold leading-[1.4] sm:text-[9px] ${
                          complete || active ? 'text-[#292929]' : 'text-[#9299a7]'
                        }`}
                      >
                        {stage.label === 'Out for Delivery' ? (
                          <>
                            Out for
                            <br />
                            Delivery
                          </>
                        ) : (
                          stage.label
                        )}
                      </p>

                      <p className="mt-1 text-[7px] leading-3 text-[#8d95a3] sm:text-[8px]">
                        {timelineDescriptions[index]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loadError && (
            <div
              role="status"
              className="mt-6 rounded-md bg-amber-50 px-3 py-2 text-[9px] text-amber-700"
            >
              We could not load all order details. Your order reference is still available above.
            </div>
          )}
        </section>

        {}
        <footer className="mt-5 text-center">
          <p className="text-[9px] text-[#9a9da5]">Thank you for choosing ChunkNChop.</p>

          <p className="mt-1 text-[8px] text-[#b0b3ba]">Fresh food. Carefully delivered.</p>
        </footer>
      </div>
    </main>
  );
}

function CheckCircleIcon() {
  return (
    <span className="inline-flex size-3 items-center justify-center rounded-full bg-emerald-600 text-white">
      <Check size={9} strokeWidth={3} />
    </span>
  );
}
