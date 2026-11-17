
'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { ArrowLeft, ArrowUpRight, Check, Clock3, MapPin, PackageCheck } from 'lucide-react';
import { formatPrice } from '@/lib/catalog';
import LiveOrderMap from '@/components/live-order-map';
import OrderConversation from '@/components/order-conversation';

type OrderStatus =
  | 'payment_pending'
  | 'paid'
  | 'assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

type StatusEvent = { status: string; at: string; note?: string };

type Order = {
  orderNumber: string;
  status: OrderStatus | 'payment_failed';
  paymentStatus: string;
  subtotalCents: number;
  currency?: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number; unit: string; priceCents: number }>;
  delivery: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    region: string;
    postalCode: string;
  };
  riderName?: string;
  authorizationUrl?: string;
  riderLocation?: { latitude: number; longitude: number; updatedAt: string } | null;
  statusHistory?: StatusEvent[];
};

type OrderResponse = { order: Order };
type RouteProps = { orderNumber: string; paymentNotice?: string };

async function fetchOrder(url: string): Promise<OrderResponse> {
  const response = await fetch(url, { cache: 'no-store' });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || 'Could not load this order.');
  }

  return result;
}

const steps: Array<{ key: OrderStatus; label: string; description: string }> = [
  {
    key: 'payment_pending',
    label: 'Order received',
    description: 'Your order is reserved while payment is confirmed.',
  },
  {
    key: 'paid',
    label: 'Payment confirmed',
    description: 'The counter is preparing your order.',
  },
  {
    key: 'assigned',
    label: 'Rider assigned',
    description: 'Your delivery partner is ready.',
  },
  {
    key: 'picked_up',
    label: 'Picked up',
    description: 'Your order has left the counter.',
  },
  {
    key: 'out_for_delivery',
    label: 'On the way',
    description: 'Your rider is heading to your address.',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Enjoy your order.',
  },
];

const statusStyles: Record<string, string> = {
  payment_pending: 'bg-[#f8f1eb] text-[#a9442c] border-[#e9d7c7]',
  payment_failed: 'bg-[#f8eae7] text-[#a9442c] border-[#e8c9c1]',
  paid: 'bg-[#eff2e9] text-[#53623f] border-[#dce5d5]',
  assigned: 'bg-[#f8f1eb] text-[#a9442c] border-[#e9d7c7]',
  picked_up: 'bg-[#f8f1eb] text-[#a9442c] border-[#e9d7c7]',
  out_for_delivery: 'bg-[#f8f1eb] text-[#a9442c] border-[#e9d7c7]',
  delivered: 'bg-[#eff2e9] text-[#53623f] border-[#dce5d5]',
  cancelled: 'bg-[#f1efeb] text-[#77736d] border-[#e6e4de]',
};

export default function OrderTracking({ orderNumber, paymentNotice }: RouteProps) {
  const { data, error, isLoading } = useSWR<OrderResponse>(
    `/api/orders/${encodeURIComponent(orderNumber)}`,
    fetchOrder,
    {
      refreshInterval: (latest) =>
        latest?.order.status &&
        !['delivered', 'cancelled', 'payment_failed'].includes(latest.order.status)
          ? 5_000
          : 0,
    },
  );

  const order = data?.order;

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen w-[min(1120px,90%)] max-[650px]:w-[92%]">
        <div className="flex min-h-[60vh] items-center justify-center text-[11px] text-[#77736d]">
          Loading your order…
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="mx-auto flex min-h-screen w-[min(1120px,90%)] items-center justify-center max-[650px]:w-[92%]">
        <section className="w-full max-w-[520px] py-[60px]">
          <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
            <span className="h-px w-[19px] bg-[#e86b3e]" />
            ORDER NOT FOUND
          </p>

          <h1 className="mt-[18px] mb-[15px] font-heading text-[clamp(38px,5vw,58px)] leading-[1.02] tracking-[-0.045em]">
            We couldn&apos;t find
            <br />
            <em>that order.</em>
          </h1>

          <p className="mb-[25px] text-[12px] leading-[1.8] text-[#77736d]">
            {error?.message ?? 'This order isn’t available to your account.'}
          </p>

          <Link
            className="inline-flex min-h-[43px] items-center justify-center border border-[#d6d1c7] bg-transparent px-[17px] text-[9px] font-bold tracking-[0.1em] text-[#514f49] transition-colors hover:border-[#a9442c] hover:text-[#a9442c]"
            href="/account/orders"
          >
            BACK TO YOUR ORDERS
          </Link>
        </section>
      </main>
    );
  }

  const currentIndex =
    order.status === 'payment_failed'
      ? 0
      : steps.findIndex((step) => step.key === order.status);

  const events = new Map(
    (order.statusHistory ?? []).map((event) => [event.status, event]),
  );

  const completed = ['delivered', 'cancelled'].includes(order.status);

  const message =
    paymentNotice === 'success'
      ? 'Paystack confirmed your payment. Your order is now in the kitchen.'
      : paymentNotice === 'failed' || order.status === 'payment_failed'
        ? 'Payment wasn’t confirmed. Your order is still in your ledger; retry checkout or contact the shop.'
        : '';

  const paymentFailed =
    paymentNotice === 'failed' || order.status === 'payment_failed';

  return (
    <main className="mx-auto min-h-screen w-[min(1120px,90%)] max-[650px]:w-[92%]">
      <header className="flex h-[76px] items-center justify-between border-b border-[#e6e4de]">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-[9px] font-bold tracking-[0.12em] text-[#514f49] transition-colors hover:text-[#a9442c]"
        >
          <ArrowLeft size={14} />
          YOUR ORDERS
        </Link>

        <Link
          href="/"
          className="font-heading text-[27px] tracking-[-0.06em] text-[#24231f]"
        >
          ChunknChop
        </Link>

        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-[9px] font-bold tracking-[0.12em] text-[#514f49] transition-colors hover:text-[#a9442c]"
        >
          SHOP THE COUNTER
          <ArrowUpRight size={14} />
        </Link>
      </header>

      <section className="py-[38px] pb-[75px] max-[650px]:py-[25px] max-[650px]:pb-[50px]">
        <div className="mb-[30px] flex items-end justify-between gap-5 max-[650px]:items-start">
          <div>
            <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
              <span className="h-px w-[19px] bg-[#e86b3e]" />
              ORDER TRACKING
            </p>

            <h1 className="mt-[15px] mb-[12px] font-heading text-[clamp(38px,4.5vw,55px)] leading-[1.02] tracking-[-0.045em]">
              {order.status === 'payment_pending' ? (
                <>
                  Ready for <em>payment.</em>
                </>
              ) : order.status === 'payment_failed' ? (
                <>
                  Let’s finish this <em>order.</em>
                </>
              ) : (
                <>
                  On its way to <em>you.</em>
                </>
              )}
            </h1>

            <p className="m-0 text-[11px] leading-[1.7] text-[#77736d]">
              {order.items[0]?.name ?? 'Order'} · placed{' '}
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <span
            className={`inline-flex shrink-0 items-center border px-[10px] py-[8px] text-[8px] font-bold tracking-[0.08em] uppercase ${
              statusStyles[order.status] ??
              'border-[#e6e4de] bg-[#fbfaf7] text-[#77736d]'
            }`}
          >
            {order.status.replaceAll('_', ' ')}
          </span>
        </div>

        {message && (
          <p
            className={`mb-[20px] border px-[15px] py-[13px] text-[10px] leading-[1.7] ${
              paymentFailed
                ? 'border-[#e8c9c1] bg-[#f8eae7] text-[#a9442c]'
                : 'border-[#dce5d5] bg-[#eff2e9] text-[#53623f]'
            }`}
            role="status"
          >
            {message}
          </p>
        )}

        <div className="grid grid-cols-[minmax(0,1.65fr)_minmax(260px,0.85fr)] items-start gap-[22px] max-[850px]:grid-cols-1">
          <section className="flex min-w-0 flex-col gap-[18px]">
            <article className="border border-[#e6e4de] bg-white p-[22px] max-[650px]:p-[15px]">
              <div className="mb-[22px] flex items-center justify-between gap-4">
                <div>
                  <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
                    <span className="h-px w-[19px] bg-[#e86b3e]" />
                    LIVE STATUS
                  </p>

                  <h2 className="mt-[9px] font-heading text-[24px] font-normal leading-[1.2]">
                    {order.status === 'delivered'
                      ? 'Delivered with care.'
                      : order.status === 'cancelled'
                        ? 'Order cancelled.'
                        : order.status === 'payment_failed'
                          ? 'Payment wasn’t completed.'
                          : 'The journey so far.'}
                  </h2>
                </div>

                <Clock3 className="shrink-0 text-[#a9442c]" size={18} />
              </div>

              <ol className="m-0 list-none p-0">
                {steps.map((step, index) => {
                  if (order.status === 'cancelled' && step.key !== 'payment_pending') {
                    return null;
                  }

                  const complete =
                    order.status === 'cancelled'
                      ? index === 0
                      : currentIndex >= index && currentIndex >= 0;

                  const event = events.get(step.key);

                  return (
                    <li
                      key={step.key}
                      className={`relative grid grid-cols-[22px_minmax(0,1fr)_auto] items-start gap-[12px] pb-[25px] last:pb-0 max-[500px]:grid-cols-[22px_minmax(0,1fr)] ${
                        index !== steps.length - 1
                          ? 'after:absolute after:top-[22px] after:bottom-0 after:left-[10px] after:w-px after:bg-[#e6e4de]'
                          : ''
                      }`}
                    >
                      <span
                        className={`relative z-[1] grid size-[22px] place-items-center rounded-full border ${
                          complete
                            ? 'border-[#a9442c] bg-[#a9442c] text-white'
                            : 'border-[#dedbd3] bg-[#f8f8f6] text-[#aaa49a]'
                        }`}
                      >
                        {complete ? <Check size={13} /> : <span className="size-[5px] rounded-full bg-current" />}
                      </span>

                      <div className="min-w-0 pt-[2px]">
                        <strong
                          className={`text-[11px] font-semibold ${
                            complete ? 'text-[#24231f]' : 'text-[#88847d]'
                          }`}
                        >
                          {step.label}
                        </strong>

                        <p className="mt-[5px] mb-0 text-[10px] leading-[1.7] text-[#88847d]">
                          {event?.note ?? step.description}
                        </p>
                      </div>

                      <time className="pt-[3px] text-right text-[8px] text-[#88847d] max-[500px]:col-start-2 max-[500px]:pt-0">
                        {event?.at
                          ? new Date(event.at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : ''}
                      </time>
                    </li>
                  );
                })}
              </ol>
            </article>

            <article className="border border-[#e6e4de] bg-white p-[22px] max-[650px]:p-[15px]">
              <div className="mb-[17px] flex items-center justify-between gap-4">
                <div>
                  <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
                    <span className="h-px w-[19px] bg-[#e86b3e]" />
                    RIDER LOCATION
                  </p>

                  <h2 className="mt-[9px] font-heading text-[21px] font-normal leading-[1.3]">
                    {order.riderName
                      ? order.riderLocation
                        ? `${order.riderName} is on the move.`
                        : `${order.riderName} will share a live location soon.`
                      : 'Your rider will appear here.'}
                  </h2>
                </div>

                <MapPin className="shrink-0 text-[#a9442c]" size={18} />
              </div>

              <LiveOrderMap
                location={order.riderLocation ?? null}
                updatedAt={order.riderLocation?.updatedAt}
              />

              <p className="mt-[13px] mb-0 flex items-center gap-[8px] text-[9px] leading-[1.6] text-[#88847d]">
                <span className="size-[6px] shrink-0 rounded-full bg-[#e86b3e]" />
                Location refreshes automatically while your order is active.
              </p>
            </article>

            <OrderConversation orderNumber={order.orderNumber} viewer="customer" />
          </section>

          <aside className="flex min-w-0 flex-col gap-[15px]">
            <article className="border border-[#e6e4de] bg-white p-[19px]">
              <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
                <span className="h-px w-[19px] bg-[#e86b3e]" />
                DELIVERY TO
              </p>

              <h2 className="mt-[12px] mb-[9px] font-heading text-[21px] font-normal">
                {order.delivery.fullName}
              </h2>

              <address className="text-[10px] leading-[1.9] text-[#77736d] not-italic">
                {order.delivery.addressLine1}
                {order.delivery.addressLine2 && (
                  <>
                    <br />
                    {order.delivery.addressLine2}
                  </>
                )}
                <br />
                {order.delivery.city}, {order.delivery.region} {order.delivery.postalCode}
                <br />
                {order.delivery.phone}
              </address>
            </article>

            <article className="border border-[#e6e4de] bg-white p-[19px]">
              <p className="mb-[17px] flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
                <span className="h-px w-[19px] bg-[#e86b3e]" />
                YOUR ORDER
              </p>

              <div className="flex flex-col gap-[14px]">
                {order.items.map((item) => (
                  <div
                    className="flex items-start justify-between gap-3 text-[10px]"
                    key={`${item.name}-${item.unit}`}
                  >
                    <span className="leading-[1.6] text-[#514f49]">
                      {item.name}{' '}
                      <small className="text-[#88847d]">× {item.quantity}</small>
                    </span>

                    <strong className="shrink-0 font-semibold">
                      {formatPrice(item.priceCents * item.quantity)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="mt-[18px] flex items-start justify-between gap-3 border-t border-[#e6e4de] pt-[15px]">
                <span className="text-[9px] leading-[1.6] text-[#77736d]">
                  Total ·{' '}
                  {order.paymentStatus === 'paid'
                    ? 'Paid'
                    : order.paymentStatus === 'failed'
                      ? 'Payment not completed'
                      : 'Payment pending'}
                </span>

                <strong className="shrink-0 text-[13px] font-semibold">
                  {formatPrice(order.subtotalCents)}
                </strong>
              </div>
            </article>

            {order.status === 'payment_pending' && order.authorizationUrl ? (
              <a
                href={order.authorizationUrl}
                className="inline-flex min-h-[46px] items-center justify-center gap-[9px] bg-[#292721] px-[12px] text-center text-[8px] font-bold tracking-[0.08em] text-white transition-colors hover:bg-[#a9442c]"
              >
                <PackageCheck size={15} />
                CONTINUE TO PAYSTACK
                <ArrowUpRight size={15} />
              </a>
            ) : (
              ['payment_pending', 'payment_failed'].includes(order.status) && (
                <Link
                  href="/checkout"
                  className="inline-flex min-h-[46px] items-center justify-center gap-[9px] bg-[#292721] px-[12px] text-center text-[8px] font-bold tracking-[0.08em] text-white transition-colors hover:bg-[#a9442c]"
                >
                  <PackageCheck size={15} />
                  RETRY CHECKOUT
                  <ArrowUpRight size={15} />
                </Link>
              )
            )}

            {completed && (
              <Link
                href="/shop"
                className="inline-flex min-h-[43px] items-center justify-center gap-[9px] border border-[#d6d1c7] bg-transparent px-[12px] text-center text-[8px] font-bold tracking-[0.08em] text-[#514f49] transition-colors hover:border-[#a9442c] hover:text-[#a9442c]"
              >
                SHOP THE COUNTER
                <ArrowUpRight size={15} />
              </Link>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
