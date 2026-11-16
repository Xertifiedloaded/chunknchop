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
  if (!response.ok) throw new Error(result?.error || 'Could not load this order.');
  return result;
}

const steps: Array<{ key: OrderStatus; label: string; description: string }> = [
  {
    key: 'payment_pending',
    label: 'Order received',
    description: 'Your order is reserved while payment is confirmed.',
  },
  { key: 'paid', label: 'Payment confirmed', description: 'The counter is preparing your order.' },
  { key: 'assigned', label: 'Rider assigned', description: 'Your delivery partner is ready.' },
  { key: 'picked_up', label: 'Picked up', description: 'Your order has left the counter.' },
  {
    key: 'out_for_delivery',
    label: 'On the way',
    description: 'Your rider is heading to your address.',
  },
  { key: 'delivered', label: 'Delivered', description: 'Enjoy your order.' },
];

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
  // console.log(order);


  if (isLoading)
    return (
      <main className="account-page">
        <div className="order-detail-loading">Loading your order…</div>
      </main>
    );
  if (error || !order)
    return (
      <main className="account-page">
        <section className="order-detail-error">
          <p className="eyebrow">
            <span /> ORDER NOT FOUND
          </p>
          <h1>
            We couldn&apos;t find
            <br />
            <em>that order.</em>
          </h1>
          <p>{error?.message ?? 'This order isn’t available to your account.'}</p>
          <Link className="admin-secondary-button" href="/account/orders">
            BACK TO YOUR ORDERS
          </Link>
        </section>
      </main>
    );

  const currentIndex =
    order.status === 'payment_failed' ? 0 : steps.findIndex((step) => step.key === order.status);
  const events = new Map((order.statusHistory ?? []).map((event) => [event.status, event]));
  const completed = ['delivered', 'cancelled'].includes(order.status);
  const message =
    paymentNotice === 'success'
      ? 'Paystack confirmed your payment. Your order is now in the kitchen.'
      : paymentNotice === 'failed' || order.status === 'payment_failed'
        ? 'Payment wasn’t confirmed. Your order is still in your ledger; retry checkout or contact the shop.'
        : '';

  return (
    <main className="account-page order-detail-page">
      <header className="catalog-top">
        <Link href="/account/orders" className="catalog-back">
          <ArrowLeft size={14} /> YOUR ORDERS
        </Link>
        <Link href="/" className="catalog-wordmark">
          ChunknChop
        </Link>
        <Link href="/shop" className="catalog-bag">
          SHOP THE COUNTER <ArrowUpRight size={14} />
        </Link>
      </header>
      <section className="order-detail-content">
        <div className="order-detail-heading">
          <div>
            <p className="eyebrow">
              <span /> ORDER TRACKING
            </p>
            <h1>
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
            {/* <p className='text-xs '>{order.orderNumber}</p> */}
            <p>
              {order.items[0]?.name ?? 'Order'} · placed{' '}

              {new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            {/* <p className='text-xs'>{order.orderNumber}</p> */}
          </div>
          <span className={`order-status-pill order-status-${order.status}`}>
            {order.status.replaceAll('_', ' ')}
          </span>
        </div>
        {message && (
          <p
            className={`order-payment-notice ${paymentNotice === 'failed' || order.status === 'payment_failed' ? 'is-error' : ''}`}
            role="status"
          >
            {message}
          </p>
        )}
        <div className="order-detail-grid">
          <section className="order-detail-main">
            <article className="order-panel order-timeline-panel">
              <div className="order-panel-heading">
                <div>
                  <p className="eyebrow">
                    <span /> LIVE STATUS
                  </p>
                  <h2>
                    {order.status === 'delivered'
                      ? 'Delivered with care.'
                      : order.status === 'cancelled'
                        ? 'Order cancelled.'
                        : order.status === 'payment_failed'
                          ? 'Payment wasn’t completed.'
                          : 'The journey so far.'}
                  </h2>
                </div>
                <Clock3 size={18} />
              </div>
              <ol className="order-timeline">
                {steps.map((step, index) => {
                  if (order.status === 'cancelled' && step.key !== 'payment_pending') return null;
                  const complete =
                    order.status === 'cancelled'
                      ? index === 0
                      : currentIndex >= index && currentIndex >= 0;
                  const event = events.get(step.key);
                  return (
                    <li key={step.key} className={complete ? 'is-complete' : ''}>
                      <span className="order-timeline-dot">
                        {complete ? <Check size={13} /> : <span />}
                      </span>
                      <div>
                        <strong>{step.label}</strong>
                        <p>{event?.note ?? step.description}</p>
                      </div>
                      <time>
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
            <article className="order-panel order-map-panel">
              <div className="order-panel-heading">
                <div>
                  <p className="eyebrow">
                    <span /> RIDER LOCATION
                  </p>
                  <h2>
                    {order.riderName
                      ? order.riderLocation
                        ? `${order.riderName} is on the move.`
                        : `${order.riderName} will share a live location soon.`
                      : 'Your rider will appear here.'}
                  </h2>
                </div>
                <MapPin size={18} />
              </div>
              <LiveOrderMap
                location={order.riderLocation ?? null}
                updatedAt={order.riderLocation?.updatedAt}
              />
              <p className="order-live-note">
                <span /> Location refreshes automatically while your order is active.
              </p>
            </article>
            <OrderConversation orderNumber={order.orderNumber} viewer="customer" />
          </section>
          <aside className="order-detail-aside">
            <article className="order-panel">
              <p className="eyebrow">
                <span /> DELIVERY TO
              </p>
              <h2>{order.delivery.fullName}</h2>
              <address>
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
            <article className="order-panel">
              <p className="eyebrow">
                <span /> YOUR ORDER
              </p>
              {order.items.map((item) => (
                <div className="order-item-line" key={`${item.name}-${item.unit}`}>
                  <span>
                    {item.name} <small>× {item.quantity}</small>
                  </span>
                  <strong>{formatPrice(item.priceCents * item.quantity)}</strong>
                </div>
              ))}
              <div className="order-total-line">
                <span>
                  Total ·{' '}
                  {order.paymentStatus === 'paid'
                    ? 'Paid'
                    : order.paymentStatus === 'failed'
                      ? 'Payment not completed'
                      : 'Payment pending'}
                </span>
                <strong>{formatPrice(order.subtotalCents)}</strong>
              </div>
            </article>
            {order.status === 'payment_pending' && order.authorizationUrl ? (
              <a href={order.authorizationUrl} className="admin-primary-button order-retry-link">
                <PackageCheck size={15} /> CONTINUE TO PAYSTACK <ArrowUpRight size={15} />
              </a>
            ) : (
              ['payment_pending', 'payment_failed'].includes(order.status) && (
                <Link href="/checkout" className="admin-primary-button order-retry-link">
                  <PackageCheck size={15} /> RETRY CHECKOUT <ArrowUpRight size={15} />
                </Link>
              )
            )}
            {completed && (
              <Link href="/shop" className="admin-secondary-button order-retry-link">
                SHOP THE COUNTER <ArrowUpRight size={15} />
              </Link>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
