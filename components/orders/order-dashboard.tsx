'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import {
  ArrowDown,
  ArrowUpRight,
  Box,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { formatPrice } from '@/lib/catalog';

type OrderItem = {
  name?: string | null;
  imageUrl?: string | null;
  quantity?: number;
};

type Order = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotalCents: number;
  totalCents?: number;
  items?: OrderItem[];
  createdAt: string;
};

type OrderResponse = {
  orders: Order[];
};

type OrderFilter = 'active' | 'paid' | 'pending' | 'preparing' | 'completed' | 'cancelled';

type OrderSort = 'latest' | 'oldest' | 'delivered' | 'cancelled';

async function fetchOrders(url: string): Promise<OrderResponse> {
  const response = await fetch(url, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Could not load your order history.');
  }

  const data = await response.json();

  return {
    orders: Array.isArray(data.orders) ? data.orders : [],
  };
}

const statusNames: Record<string, string> = {
  payment_pending: 'Awaiting payment',
  payment_failed: 'Payment not completed',
  paid: 'Preparing',
  preparing: 'Preparing',
  assigned: 'Rider assigned',
  picked_up: 'Picked up',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const isActive = (order: Order) =>
  !['delivered', 'cancelled', 'payment_failed'].includes(order.status);

const isCompleted = (order: Order) => order.status === 'delivered';

const isCancelled = (order: Order) => order.status === 'cancelled';

const isPaid = (order: Order) => order.paymentStatus === 'paid';

const isPending = (order: Order) =>
  ['pending', 'payment_pending'].includes(order.paymentStatus) ||
  order.status === 'payment_pending';

const isPreparing = (order: Order) => ['paid', 'preparing'].includes(order.status);

function getStatusStyle(status: string) {
  switch (status) {
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700';

    case 'cancelled':
    case 'payment_failed':
      return 'bg-red-50 text-red-600';

    case 'out_for_delivery':
      return 'bg-brand text-white';

    case 'picked_up':
    case 'assigned':
      return 'bg-blue-50 text-blue-700';

    default:
      return 'bg-[#fff0e9] text-brand';
  }
}

function OrderProductImage({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  return (
    <div className="relative flex h-[66px] w-[66px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#f3f3f4] text-brand sm:h-[76px] sm:w-[76px]">
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill sizes="76px" unoptimized className="object-cover" />
      ) : (
        <PackageCheck size={24} strokeWidth={1.5} />
      )}
    </div>
  );
}

export default function OrderDashboard() {
  const { data, error, isLoading } = useSWR<OrderResponse>('/api/orders', fetchOrders, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
  });

  const [activeFilter, setActiveFilter] = useState<OrderFilter>('active');

  const [sortBy, setSortBy] = useState<OrderSort>('latest');

  const orders = data?.orders ?? [];

  const paidOrders = orders.filter(isPaid);
  const pendingOrders = orders.filter(isPending);
  const preparingOrders = orders.filter(isPreparing);

  const totalSpend = paidOrders.reduce(
    (sum, order) => sum + (order.totalCents ?? order.subtotalCents ?? 0),
    0,
  );

  const activeOrders = orders.filter(isActive);
  const completedOrders = orders.filter(isCompleted);
  const cancelledOrders = orders.filter(isCancelled);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    switch (activeFilter) {
      case 'active':
        result = result.filter(isActive);
        break;

      case 'paid':
        result = result.filter(isPaid);
        break;

      case 'pending':
        result = result.filter(isPending);
        break;

      case 'preparing':
        result = result.filter(isPreparing);
        break;

      case 'completed':
        result = result.filter(isCompleted);
        break;

      case 'cancelled':
        result = result.filter(isCancelled);
        break;
    }

    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'delivered') {
      result.sort((a, b) => Number(b.status === 'delivered') - Number(a.status === 'delivered'));
    } else {
      result.sort((a, b) => Number(b.status === 'cancelled') - Number(a.status === 'cancelled'));
    }

    return result;
  }, [orders, activeFilter, sortBy]);

  const filters: {
    label: string;
    value: OrderFilter;
    count: number;
  }[] = [
    {
      label: 'All Active',
      value: 'active',
      count: activeOrders.length,
    },
    {
      label: 'Paid',
      value: 'paid',
      count: paidOrders.length,
    },
    {
      label: 'Pending',
      value: 'pending',
      count: pendingOrders.length,
    },
    {
      label: 'Preparing',
      value: 'preparing',
      count: preparingOrders.length,
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
    <div className="mx-auto w-full max-w-7xl px-3 py-6 text-[#24231f] sm:px-5 sm:py-8 lg:px-8 lg:py-9">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-7 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <p className="mb-1.5 text-[9px] font-bold tracking-[0.16em] text-brand sm:text-[10px]">
            DASHBOARD
          </p>

          <h1 className="font-heading text-[23px] font-bold tracking-tight text-[#24231f] sm:text-[26px] lg:text-[28px]">
            My Orders
          </h1>

          <p className="mt-1.5 max-w-lg text-[11px] leading-5 text-[#77736d] sm:text-xs">
            Track deliveries, revisit past orders and reorder your favourite cuts in one tap.
          </p>
        </div>

        <Link
          href="/shop"
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-[10px] font-semibold text-white transition-colors hover:bg-[#d85d32] sm:min-h-10 sm:px-4 sm:text-[11px]"
        >
          <ShoppingBag size={13} />
          Shop fresh cuts
        </Link>
      </div>

      {/* Analytics */}
      <section
        className="mb-6 grid grid-cols-2 gap-2.5 sm:mb-7 sm:gap-3 xl:grid-cols-4"
        aria-label="Order analytics"
      >
        <article className="min-w-0 rounded-lg border border-[#eeece8] bg-white p-3.5 sm:p-4">
          <span className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#fff0e9] text-brand">
            <Box size={14} />
          </span>

          <strong className="block font-heading text-xl font-bold leading-tight text-[#24231f] sm:text-[22px]">
            {orders.length}
          </strong>

          <p className="mt-1 text-[10px] text-[#77736d] sm:text-[11px]">Total orders</p>
        </article>

        <article className="min-w-0 rounded-lg border border-[#eeece8] bg-white p-3.5 sm:p-4">
          <span className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#fff0e9] text-brand">
            <Truck size={14} />
          </span>

          <strong className="block font-heading text-xl font-bold leading-tight text-[#24231f] sm:text-[22px]">
            {activeOrders.length}
          </strong>

          <p className="mt-1 text-[10px] text-[#77736d] sm:text-[11px]">Active deliveries</p>
        </article>

        <article className="min-w-0 rounded-lg border border-[#eeece8] bg-white p-3.5 sm:p-4">
          <span className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#fff0e9] text-brand">
            <CheckCircle2 size={14} />
          </span>

          <strong className="block font-heading text-xl font-bold leading-tight text-[#24231f] sm:text-[22px]">
            {completedOrders.length}
          </strong>

          <p className="mt-1 text-[10px] text-[#77736d] sm:text-[11px]">Delivered</p>
        </article>

        <article className="min-w-0 rounded-lg border border-[#eeece8] bg-white p-3.5 sm:p-4">
          <span className="mb-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#fff0e9] text-brand">
            <ShoppingBag size={14} />
          </span>

          <strong className="block break-words font-heading text-lg font-bold leading-tight text-[#24231f] sm:text-[21px]">
            {formatPrice(totalSpend)}
          </strong>

          <p className="mt-1 text-[10px] text-[#77736d] sm:text-[11px]">Lifetime spend</p>
        </article>
      </section>

      {/* Filters and sorting */}
      <section className="mb-5 flex flex-col gap-2.5 rounded-lg border border-[#eeece8] bg-white p-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-1 overflow-x-auto rounded-md bg-[#f5f5f4] p-1 sm:w-auto">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              aria-pressed={activeFilter === filter.value}
              className={`inline-flex min-h-8 shrink-0 items-center gap-1 rounded px-3 py-1.5 text-[10px] font-medium transition-colors sm:px-3.5 sm:text-[11px] ${
                activeFilter === filter.value
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-[#77736d] hover:text-[#24231f]'
              }`}
            >
              {filter.label}
              <span className="opacity-75">({filter.count})</span>
            </button>
          ))}
        </div>

        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto px-1 pb-1 sm:pb-0">
          <span className="flex shrink-0 items-center gap-1 pr-1 text-[9px] font-semibold tracking-wide text-[#77736d] sm:text-[10px]">
            <ArrowDown size={12} />
            SORT
          </span>

          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSortBy(option.value)}
              aria-pressed={sortBy === option.value}
              className={`shrink-0 rounded border px-2.5 py-1.5 text-[9px] font-medium transition-colors sm:px-3 sm:text-[10px] ${
                sortBy === option.value
                  ? 'border-[#ffd0b8] bg-[#fff5f0] text-brand'
                  : 'border-[#e6e4de] bg-white text-[#77736d] hover:border-brand hover:text-brand'
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
          <div className="rounded-lg border border-[#eeece8] bg-white py-14 text-center">
            <div className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-2 border-[#e6e4de] border-t-brand" />

            <p className="text-[11px] text-[#88847d]">Loading your orders…</p>
          </div>
        ) : error ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700"
            role="alert"
          >
            {error.message}
          </p>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-[#eeece8] bg-white px-4 py-12 text-center sm:py-14">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff0e9] text-brand">
              <Package size={19} />
            </span>

            <h3 className="font-heading text-base font-semibold text-[#24231f] sm:text-lg">
              {orders.length === 0 ? 'Your order history is empty.' : `No ${activeFilter} orders.`}
            </h3>

            <p className="mt-1.5 max-w-sm text-[11px] leading-5 text-[#88847d] sm:text-xs">
              {orders.length === 0
                ? 'Once you place an order, you can follow its progress here.'
                : 'Your orders in this category will appear here.'}
            </p>

            {orders.length === 0 && (
              <Link
                href="/shop"
                className="mt-5 inline-flex min-h-9 items-center gap-1.5 rounded-md bg-brand px-4 text-[10px] font-semibold text-white transition-colors hover:bg-[#a9442c]"
              >
                <ShoppingBag size={13} />
                Shop fresh cuts
                <ArrowUpRight size={13} />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const items = order.items ?? [];

              const itemCount = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

              const firstItem = items[0];

              const productName = firstItem?.name || 'Order';

              const remainingItems = Math.max(items.length - 1, 0);

              const orderUrl = `/account/orders/${encodeURIComponent(order.orderNumber)}`;

              const orderTotal = order.totalCents ?? order.subtotalCents;

              return (
                <article
                  key={order.orderNumber}
                  className="overflow-hidden rounded-lg border border-[#eeece8] bg-white transition-shadow hover:shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-3.5 p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <OrderProductImage imageUrl={firstItem?.imageUrl} name={productName} />

                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                          <h3 className="max-w-full break-words text-[11px] font-bold text-[#24231f] sm:text-xs">
                            {productName}

                            {remainingItems > 0 && (
                              <span className="ml-1 font-normal text-[#88847d]">
                                +{remainingItems} more
                              </span>
                            )}
                          </h3>

                          <span
                            className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-1 text-[8px] font-semibold sm:text-[9px] ${getStatusStyle(order.status)}`}
                          >
                            <Clock3 size={9} />
                            {statusNames[order.status] ?? 'Order received'}
                          </span>
                        </div>

                        <p className="text-[9px] text-[#99958e] sm:text-[10px]">
                          Order reference: {order.orderNumber}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] text-[#77736d] sm:text-[10px]">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={11} />

                            {new Date(order.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <Package size={11} />
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#f0eee9] pt-2.5 sm:min-w-[105px] sm:flex-col sm:items-end sm:justify-center sm:border-0 sm:pt-0">
                      <span className="text-[8px] font-semibold tracking-[0.1em] text-[#a0a0a0] sm:text-[9px]">
                        TOTAL
                      </span>

                      <strong className="font-heading text-sm font-bold text-brand sm:text-base">
                        {formatPrice(orderTotal)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 border-t border-[#f0eee9] bg-[#f9fafb] px-3.5 py-2.5 sm:px-4">
                    <Link
                      href={orderUrl}
                      className="inline-flex min-h-7 items-center justify-center gap-1.5 rounded border border-[#e6e4de] bg-white px-2.5 py-1.5 text-[9px] font-semibold text-[#333333] transition-colors hover:border-brand hover:text-brand sm:text-[10px]"
                    >
                      <Eye size={11} />
                      View details
                    </Link>

                    {isActive(order) && (
                      <Link
                        href={orderUrl}
                        className="inline-flex min-h-7 items-center justify-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[9px] font-semibold text-white transition-colors hover:bg-[#d85d32] sm:text-[10px]"
                      >
                        <Truck size={11} />
                        Track order
                      </Link>
                    )}

                    {order.paymentStatus !== 'paid' && (
                      <span className="ml-auto text-[9px] text-[#88847d]">Payment pending</span>
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
