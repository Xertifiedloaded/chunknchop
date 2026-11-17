
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Box,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
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

type OrderFilter = 'active' | 'completed' | 'cancelled';
type OrderSort = 'latest' | 'oldest' | 'delivered' | 'cancelled';

async function fetchOrders(url: string): Promise<OrderResponse> {
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Could not load your order history.');
  }

  return response.json();
}

const statusNames: Record<string, string> = {
  payment_pending: 'Awaiting payment',
  payment_failed: 'Payment not completed',
  paid: 'Preparing',
  assigned: 'Rider assigned',
  picked_up: 'Picked up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const isActive = (order: Order) =>
  !['delivered', 'cancelled', 'payment_failed'].includes(order.status);

const isCompleted = (order: Order) => order.status === 'delivered';

const isCancelled = (order: Order) => order.status === 'cancelled';

function getStatusStyle(status: string) {
  switch (status) {
    case 'delivered':
      return 'bg-green-50 text-green-700';

    case 'cancelled':
    case 'payment_failed':
      return 'bg-red-50 text-red-600';

    case 'out_for_delivery':
      return 'bg-[#e86b3e] text-white';

    case 'picked_up':
    case 'assigned':
      return 'bg-blue-50 text-blue-700';

    default:
      return 'bg-[#fff0e9] text-[#e86b3e]';
  }
}

export default function OrderDashboard() {
  const { data, error, isLoading } = useSWR<OrderResponse>(
    '/api/orders',
    fetchOrders,
    {
      refreshInterval: 15_000,
    },
  );

  const [activeFilter, setActiveFilter] = useState<OrderFilter>('active');
  const [sortBy, setSortBy] = useState<OrderSort>('latest');

  const orders = data?.orders ?? [];

  const paidOrders = orders.filter(
    (order) => order.paymentStatus === 'paid',
  );

  const totalSpend = paidOrders.reduce(
    (sum, order) => sum + order.subtotalCents,
    0,
  );

  const activeOrders = orders.filter(isActive);
  const completedOrders = orders.filter(isCompleted);
  const cancelledOrders = orders.filter(isCancelled);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (activeFilter === 'active') {
      result = result.filter(isActive);
    } else if (activeFilter === 'completed') {
      result = result.filter(isCompleted);
    } else {
      result = result.filter(isCancelled);
    }

    if (sortBy === 'latest') {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === 'oldest') {
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime(),
      );
    } else if (sortBy === 'delivered') {
      result.sort((a, b) =>
        Number(b.status === 'delivered') -
        Number(a.status === 'delivered'),
      );
    } else {
      result.sort((a, b) =>
        Number(b.status === 'cancelled') -
        Number(a.status === 'cancelled'),
      );
    }

    return result;
  }, [orders, activeFilter, sortBy]);

  const filters: {
    label: string;
    value: OrderFilter;
    count: number;
  }[] = [
    {
      label: 'Active',
      value: 'active',
      count: activeOrders.length,
    },
    {
      label: 'Completed',
      value: 'completed',
      count: completedOrders.length,
    },
    {
      label: 'Cancelled',
      value: 'cancelled',
      count: cancelledOrders.length,
    },
  ];

  const sortOptions: {
    label: string;
    value: OrderSort;
  }[] = [
    { label: 'Latest', value: 'latest' },
    { label: 'Oldest', value: 'oldest' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 text-[#24231f] sm:px-6 sm:py-10 lg:px-8">
      {/* Page heading */}
      <div className="mb-7 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-[#e86b3e]">
            DASHBOARD
          </p>

          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#24231f] sm:text-[32px]">
            My Orders
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#77736d]">
            Track deliveries, revisit past orders and reorder your favourite
            cuts in one tap.
          </p>
        </div>

        <Link
          href="/shop"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#e86b3e] px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#d85d32]"
        >
          <ShoppingBag size={15} />
          Shop fresh cuts
        </Link>
      </div>

      {/* Analytics cards */}
      <section
        className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Order analytics"
      >
        <article className="rounded-xl border border-[#eeece8] bg-white p-5">
          <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#fff0e9] text-[#e86b3e]">
            <Box size={16} />
          </span>

          <strong className="block font-heading text-2xl font-bold text-[#24231f]">
            {orders.length}
          </strong>

          <p className="mt-1 text-xs text-[#77736d]">Total orders</p>
        </article>

        <article className="rounded-xl border border-[#eeece8] bg-white p-5">
          <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#fff0e9] text-[#e86b3e]">
            <Truck size={16} />
          </span>

          <strong className="block font-heading text-2xl font-bold text-[#24231f]">
            {activeOrders.length}
          </strong>

          <p className="mt-1 text-xs text-[#77736d]">Active deliveries</p>
        </article>

        <article className="rounded-xl border border-[#eeece8] bg-white p-5">
          <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#fff0e9] text-[#e86b3e]">
            <CheckCircle2 size={16} />
          </span>

          <strong className="block font-heading text-2xl font-bold text-[#24231f]">
            {completedOrders.length}
          </strong>

          <p className="mt-1 text-xs text-[#77736d]">Delivered</p>
        </article>

        <article className="rounded-xl border border-[#eeece8] bg-white p-5">
          <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#fff0e9] text-[#e86b3e]">
            <ShoppingBag size={16} />
          </span>

          <strong className="block break-words font-heading text-2xl font-bold text-[#24231f]">
            {formatPrice(totalSpend)}
          </strong>

          <p className="mt-1 text-xs text-[#77736d]">Lifetime spend</p>
        </article>
      </section>

      {/* Filters and sorting */}
      <section className="mb-6 flex flex-col justify-between gap-4 rounded-full border border-[#eeece8] bg-white p-2 sm:flex-row sm:items-center">
        <div className="flex w-full items-center gap-1 overflow-x-auto rounded-full bg-[#f3f3f4] p-1 sm:w-auto">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              aria-pressed={activeFilter === filter.value}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                activeFilter === filter.value
                  ? 'bg-[#e86b3e] text-white shadow-sm'
                  : 'text-[#77736d] hover:text-[#24231f]'
              }`}
            >
              {filter.label}
              <span className="opacity-75">({filter.count})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:pb-0">
          <span className="flex shrink-0 items-center gap-1.5 pr-1 text-[10px] font-semibold tracking-wide text-[#77736d]">
            <ArrowDown size={13} />
            FILTER
          </span>

          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSortBy(option.value)}
              aria-pressed={sortBy === option.value}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                sortBy === option.value
                  ? 'border-[#ffd0b8] bg-[#fff5f0] text-[#e86b3e]'
                  : 'border-[#e6e4de] bg-white text-[#77736d] hover:border-[#e86b3e] hover:text-[#e86b3e]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* Orders */}
      <section aria-label="Your orders">
        {isLoading ? (
          <div className="rounded-xl border border-[#eeece8] bg-white py-16 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#e6e4de] border-t-[#e86b3e]" />
            <p className="text-sm text-[#88847d]">
              Loading your orders…
            </p>
          </div>
        ) : error ? (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
          >
            {error.message}
          </p>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-[#eeece8] bg-white px-5 py-16 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0e9] text-[#e86b3e]">
              <Package size={22} />
            </span>

            <h3 className="font-heading text-xl font-semibold text-[#24231f]">
              {orders.length === 0
                ? 'Your order history is empty.'
                : `No ${activeFilter} orders.`}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#88847d]">
              {orders.length === 0
                ? 'Once you place an order, you can follow its progress here.'
                : 'Your orders in this category will appear here.'}
            </p>

            {orders.length === 0 && (
              <Link
                href="/shop"
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#e86b3e] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#a9442c]"
              >
                <ShoppingBag size={15} />
                Shop fresh cuts
                <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const itemCount = order.items.reduce(
                (sum, item) => sum + (item.quantity ?? 0),
                0,
              );

              const firstItem = order.items[0]?.name ?? 'Order';
              const remainingItems = Math.max(order.items.length - 1, 0);

              const orderUrl = `/account/orders/${encodeURIComponent(order.orderNumber)}`;

              return (
                <article
                  key={order.orderNumber}
                  className="overflow-hidden rounded-xl border border-[#eeece8] bg-white transition-shadow hover:shadow-sm"
                >
                  {/* Order information */}
                  <div className="flex flex-col justify-between gap-5 p-4 sm:flex-row sm:items-center sm:p-5">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f3f3f4] text-[#e86b3e] sm:h-[104px] sm:w-[104px]">
                        <PackageCheck size={30} strokeWidth={1.5} />
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h3 className="break-all text-sm font-bold text-[#24231f] sm:text-[15px]">
                            {order.orderNumber}
                          </h3>

                          <span
                            className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[9px] font-semibold ${getStatusStyle(order.status)}`}
                          >
                            <Clock3 size={10} />
                            {statusNames[order.status] ?? 'Order received'}
                          </span>
                        </div>

                        <p className="truncate text-xs text-[#626d7e] sm:text-[13px]">
                          {firstItem}
                          {remainingItems > 0
                            ? ` +${remainingItems} more`
                            : ''}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#77736d]">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={13} />
                            {new Date(order.createdAt).toLocaleDateString(
                              'en-GB',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              },
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Package size={13} />
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order total */}
                    <div className="flex items-center justify-between border-t border-[#f0eee9] pt-3 sm:min-w-[110px] sm:flex-col sm:items-end sm:justify-start sm:border-0 sm:pt-0">
                      <span className="text-[9px] font-semibold tracking-[0.1em] text-[#a0a0a0]">
                        TOTAL
                      </span>

                      <strong className="font-heading text-base font-bold text-[#e86b3e]">
                        {formatPrice(order.subtotalCents)}
                      </strong>
                    </div>
                  </div>

                  {/* Order actions */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-[#f0eee9] bg-[#f9fafb] px-4 py-3 sm:px-5">
                    <Link
                      href={orderUrl}
                      className="inline-flex min-h-8 items-center justify-center gap-2 rounded-md border border-[#e6e4de] bg-white px-3 py-2 text-[10px] font-semibold text-[#333333] transition-colors hover:border-[#e86b3e] hover:text-[#e86b3e]"
                    >
                      <Eye size={13} />
                      View Details
                    </Link>

                    {isActive(order) && (
                      <Link
                        href={orderUrl}
                        className="inline-flex min-h-8 items-center justify-center gap-2 rounded-md bg-[#e86b3e] px-4 py-2 text-[10px] font-semibold text-white transition-colors hover:bg-[#d85d32]"
                      >
                        <Truck size={13} />
                        Track Order
                      </Link>
                    )}

                    {order.paymentStatus !== 'paid' && (
                      <span className="ml-auto text-[10px] text-[#88847d]">
                        Payment pending
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
