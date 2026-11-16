'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { ArrowUpRight, Box, Clock3, PackageCheck } from 'lucide-react';
import { formatPrice } from '@/lib/catalog';

type Order = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotalCents: number;
  items: Array<{ name?: string; quantity?: number }>;
  createdAt: string;
};
type OrderResponse = { orders: Order[] };

async function fetchOrders(url: string): Promise<OrderResponse> {
  const response = await fetch(url, { cache: 'no-store' });
  // console.log('fetchOrders response:', await response.json());
  if (!response.ok) throw new Error('Could not load your order history.');
  return response.json();
}

const statusNames: Record<string, string> = {
  payment_pending: 'Awaiting payment',
  payment_failed: 'Payment not completed',
  paid: 'Preparing your order',
  assigned: 'Rider assigned',
  picked_up: 'Picked up',
  out_for_delivery: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderDashboard() {
  const { data, error, isLoading } = useSWR<OrderResponse>('/api/orders', fetchOrders, {
    refreshInterval: 15_000,
  });
  const orders = data?.orders ?? [];
  const paidOrders = orders.filter((order) => order.paymentStatus === 'paid');
  const totalSpend = paidOrders.reduce((sum, order) => sum + order.subtotalCents, 0);
  const activeOrders = orders.filter(
    (order) => !['delivered', 'cancelled', 'payment_failed'].includes(order.status),
  ).length;

  return (
    <div className="order-dashboard">
      <div className="order-dashboard-heading">
        <div>
          <p className="eyebrow">
            <span /> YOUR TABLE
          </p>
          <h2>
            Order <em>ledger.</em>
          </h2>
          <p>Every order, from the first cut to your front door.</p>
        </div>
        <Link className="admin-secondary-button" href="/shop">
          SHOP THE COUNTER <ArrowUpRight size={15} />
        </Link>
      </div>
      <section className="order-analytics" aria-label="Order analytics">
        <article>
          <span className="order-stat-icon">
            <Box size={17} />
          </span>
          <p>ORDERS PLACED</p>
          <strong>{orders.length}</strong>
          <small>Since your first visit</small>
        </article>
        <article>
          <span className="order-stat-icon">
            <PackageCheck size={17} />
          </span>
          <p>COMPLETED SPEND</p>
          <strong>{formatPrice(totalSpend)}</strong>
          <small>
            {paidOrders.length} paid {paidOrders.length === 1 ? 'order' : 'orders'}
          </small>
        </article>
        <article>
          <span className="order-stat-icon">
            <Clock3 size={17} />
          </span>
          <p>IN THE WORKS</p>
          <strong>{activeOrders}</strong>
          <small>{activeOrders ? 'We’re keeping an eye on it' : 'No active deliveries'}</small>
        </article>
      </section>
      <section className="order-history" aria-labelledby="order-history-title">
        <div className="order-history-heading">
          <div>
            <p className="eyebrow">
              <span /> YOUR HISTORY
            </p>
            <h3 id="order-history-title">Recent orders</h3>
          </div>
          <span>{orders.length} total</span>
        </div>
        {isLoading ? (
          <p className="order-feedback">Loading your orders…</p>
        ) : error ? (
          <p className="order-feedback" role="alert">
            {error.message}
          </p>
        ) : orders.length === 0 ? (
          <div className="order-empty">
            <Box size={25} />
            <h3>Your ledger is waiting.</h3>
            <p>Once you place an order, you can follow its progress here.</p>
            <Link href="/shop" className="admin-primary-button">
              EXPLORE THE COUNTER <ArrowUpRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="order-list">
            {orders.map((order) => (
              <article className="order-row" key={order.orderNumber}>
                <div className="order-row-mark">
                  <PackageCheck size={18} />
                </div>
                <div className="order-row-main">
                  <span>
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    · {order.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)} items
                  </span>
                  <h3 className='capitalize'>{order.items[0]?.name ?? 'Order'}</h3>
                  <small>{statusNames[order.status] ?? 'Order received'}</small>
                </div>
                <div className="order-row-total">
                  <strong>{formatPrice(order.subtotalCents)}</strong>
                  <span>{order.paymentStatus === 'paid' ? 'PAID' : 'PAYMENT PENDING'}</span>
                </div>
                <Link
                  href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                  className="order-track-link"
                >
                  TRACK ORDER <ArrowUpRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
