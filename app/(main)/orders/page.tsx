'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';

interface OrderItem {
  productId: string;
  quantity: number;
  pricePerUnit: number;
  tier: string | null;
  variants?: unknown;

  product: {
    name: string;
    images?: string[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;

  status: string;
  paymentStatus: string;
  paymentMethod: string | null;

  createdAt: string;
  deliveredAt: string | null;
  estimatedDelivery: string | null;

  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingCountry?: string;

  trackingNumber?: string | null;

  items: OrderItem[];
}

type OrderTab = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
type SortFilter = 'latest' | 'oldest';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  PROCESSING: 'bg-orange-100 text-orange-600',
  CONFIRMED: 'bg-orange-100 text-orange-600',
  PREPARING: 'bg-orange-100 text-orange-600',
  PACKAGED: 'bg-blue-100 text-blue-600',
  SHIPPED: 'bg-blue-100 text-blue-600',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-600',
  DELIVERED: 'bg-green-100 text-green-600',
  CANCELLED: 'bg-red-100 text-red-600',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  CASH_ON_DELIVERY: 'Cash on Delivery',
  PAYSTACK: 'Paystack',
};

function normalizeStatus(status: string | null | undefined) {
  return (status ?? '').trim().toUpperCase();
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = normalizeStatus(status);

  const style =
    STATUS_STYLES[normalizedStatus] ?? 'bg-gray-100 text-gray-600';

  const label = normalizedStatus
    .replaceAll('_', ' ')
    .toLowerCase();

  return (
    <span
      className={`shrink-0 rounded px-2 py-1 text-xs font-medium capitalize ${style}`}
    >
      {label || 'Unknown'}
    </span>
  );
}

function formatPaymentMethod(method: string | null) {
  if (!method) {
    return 'Not selected yet';
  }

  const normalizedMethod = normalizeStatus(method);

  return (
    PAYMENT_METHOD_LABELS[normalizedMethod] ??
    normalizedMethod.replaceAll('_', ' ').toLowerCase()
  );
}

function formatShippingAddress(order: Order) {
  const parts = [
    order.shippingAddress,
    order.shippingCity,
    order.shippingState,
    order.shippingZip,
    order.shippingCountry,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(', ')
    : 'No shipping address on file';
}

function isActiveOrder(order: Order) {
  const status = normalizeStatus(order.status);

  return status !== 'DELIVERED' && status !== 'CANCELLED';
}

export default function OrdersPage() {
  const router = useRouter();

  const { user, accessToken } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] =
    useState<OrderTab>('ACTIVE');

  const [sortFilter, setSortFilter] =
    useState<SortFilter>('latest');

  const fetchOrders = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/customer/orders', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        toast.error(
          'Your session has expired. Please sign in again.'
        );

        router.push('/auth/login?redirect=/orders');
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error || 'Failed to load your orders'
        );
      }

      const fetchedOrders = Array.isArray(data?.orders)
        ? data.orders
        : [];

      console.log(
        'CUSTOMER ORDERS:',
        fetchedOrders.map((order: Order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
          items: order.items?.length ?? 0,
        }))
      );

      setOrders(fetchedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);

      const message =
        err instanceof Error
          ? err.message
          : 'Failed to load your orders';

      setError(message);

      toast.error('Unable to load your orders');
    } finally {
      setLoading(false);
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/orders');
      return;
    }

    if (accessToken) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [
    user,
    accessToken,
    router,
    fetchOrders,
  ]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;

    const activeDeliveries = orders.filter(
      (order) => isActiveOrder(order)
    ).length;

    const delivered = orders.filter(
      (order) =>
        normalizeStatus(order.status) === 'DELIVERED'
    ).length;

    const cancelled = orders.filter(
      (order) =>
        normalizeStatus(order.status) === 'CANCELLED'
    ).length;

    const lifetimeSpent = orders
      .filter(
        (order) =>
          normalizeStatus(order.paymentStatus) === 'PAID'
      )
      .reduce(
        (sum, order) => sum + Number(order.total || 0),
        0
      );

    return {
      totalOrders,
      activeDeliveries,
      delivered,
      cancelled,
      lifetimeSpent,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let result = orders.filter((order) => {
      const status = normalizeStatus(order.status);

      if (activeTab === 'ACTIVE') {
        return isActiveOrder(order);
      }

      if (activeTab === 'COMPLETED') {
        return status === 'DELIVERED';
      }

      if (activeTab === 'CANCELLED') {
        return status === 'CANCELLED';
      }

      return true;
    });

    result = [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (sortFilter === 'oldest') {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

    return result;
  }, [orders, activeTab, sortFilter]);

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-ink sm:mb-6"
          >
            <ArrowLeft className="h-4 w-4 text-brand" />
            Back to Store
          </Link>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-sora text-2xl font-bold tracking-tight text-charcoal sm:text-3xl">
                My Orders
              </h1>

              <p className="font-worksans mt-1 text-sm text-ink">
                Track deliveries, revisit past orders and
                reorder your favourite cuts in one tap.
              </p>
            </div>

            {!loading && orders.length > 0 && (
              <span className="text-sm text-ink">
                {orders.length}{' '}
                {orders.length === 1 ? 'order' : 'orders'}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        {!loading && !error && orders.length > 0 && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-4 sm:gap-4">

              {/* Total Orders */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cream bg-cream">
                  <Package className="h-4 w-4 text-brand" />
                </div>

                <p className="font-sora mt-2 text-2xl font-bold text-charcoal">
                  {stats.totalOrders}
                </p>

                <p className="font-worksans text-xs tracking-wide text-ink">
                  Total Orders
                </p>
              </div>

              {/* Active */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cream bg-cream">
                  <Truck className="h-4 w-4 text-brand" />
                </div>

                <p className="font-sora mt-2 text-2xl font-bold text-charcoal">
                  {stats.activeDeliveries}
                </p>

                <p className="font-worksans text-xs tracking-wide text-ink">
                  Active Deliveries
                </p>
              </div>

              {/* Delivered */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cream bg-cream">
                  <CheckCircle2 className="h-4 w-4 text-brand" />
                </div>

                <p className="font-sora mt-2 text-2xl font-bold text-charcoal">
                  {stats.delivered}
                </p>

                <p className="font-worksans text-xs tracking-wide text-ink">
                  Delivered
                </p>
              </div>

              {/* Lifetime */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cream bg-cream">
                  <Wallet className="h-4 w-4 text-brand" />
                </div>

                <p className="font-sora mt-2 text-2xl font-bold text-brand">
                  {formatCurrency(stats.lifetimeSpent)}
                </p>

                <p className="font-worksans text-xs tracking-wide text-ink">
                  Lifetime Spent
                </p>
              </div>
            </div>

            {/* Tabs / Sort */}
            <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex flex-wrap items-center gap-2">

                <button
                  type="button"
                  onClick={() => setActiveTab('ACTIVE')}
                  className={`font-worksans inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === 'ACTIVE'
                      ? 'bg-brand text-white'
                      : 'border border-gray-200 bg-white text-ink hover:bg-gray-50'
                  }`}
                >
                  Active

                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      activeTab === 'ACTIVE'
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {stats.activeDeliveries}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab('COMPLETED')
                  }
                  className={`font-worksans inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === 'COMPLETED'
                      ? 'bg-brand text-white'
                      : 'border border-gray-200 bg-white text-ink hover:bg-gray-50'
                  }`}
                >
                  Completed

                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      activeTab === 'COMPLETED'
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {stats.delivered}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab('CANCELLED')
                  }
                  className={`font-worksans inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === 'CANCELLED'
                      ? 'bg-brand text-white'
                      : 'border border-gray-200 bg-white text-ink hover:bg-gray-50'
                  }`}
                >
                  Cancelled

                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      activeTab === 'CANCELLED'
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {stats.cancelled}
                  </span>
                </button>
              </div>

              <select
                value={sortFilter}
                onChange={(event) =>
                  setSortFilter(
                    event.target.value as SortFilter
                  )
                }
                className="font-worksans w-full rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-ink sm:w-auto"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />

              <p className="text-sm text-ink">
                Loading your orders...
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-center sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <Package className="h-7 w-7 text-red-500" />
            </div>

            <h2 className="text-lg font-semibold text-ink">
              Unable to load orders
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-ink">
              We couldn&apos;t retrieve your orders right
              now. Please try again.
            </p>

            <Button
              onClick={fetchOrders}
              className="mt-5 bg-brand hover:bg-orange-600"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* No orders */}
        {!loading &&
          !error &&
          orders.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm sm:px-10 sm:py-16">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                <ShoppingBag className="h-8 w-8 text-brand" />
              </div>

              <h2 className="text-xl font-semibold text-ink">
                No orders yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink">
                You haven&apos;t placed any orders yet.
                Browse our products and place your first
                order today.
              </p>

              <Link
                href="/"
                className="mt-6 inline-block"
              >
                <Button className="bg-brand hover:bg-orange-600">
                  Start Shopping
                </Button>
              </Link>
            </div>
          )}

        {/* No orders in current tab */}
        {!loading &&
          !error &&
          orders.length > 0 &&
          filteredOrders.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm sm:px-10 sm:py-16">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                <Package className="h-8 w-8 text-brand" />
              </div>

              <h2 className="text-xl font-semibold text-ink">
                No orders in this view
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink">
                Try a different tab to see more of your
                orders.
              </p>
            </div>
          )}

        {/* Orders */}
        {!loading &&
          !error &&
          filteredOrders.length > 0 && (
            <div className="space-y-4 sm:space-y-5">
              {filteredOrders.map((order) => {
                const firstItem = order.items?.[0];

                const firstImage =
                  firstItem?.product?.images?.[0];

                const deliveredLabel = formatDate(
                  order.deliveredAt
                );

                const estimatedLabel = formatDate(
                  order.estimatedDelivery
                );

                const orderStatus = normalizeStatus(
                  order.status
                );

                const paymentStatus = normalizeStatus(
                  order.paymentStatus
                );

                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                  >
                    {/* Main order */}
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">

                      {/* Product / information */}
                      <div className="flex min-w-0 gap-3 sm:gap-4">

                        {/* Image */}
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-20 sm:w-20">
                          {firstImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={firstImage}
                              alt={
                                firstItem?.product?.name ??
                                'Product'
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-7 w-7 text-ink sm:h-8 sm:w-8" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">

                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-semibold uppercase text-charcoal">
                              {order.orderNumber ||
                                order.id}
                            </h3>

                            <StatusBadge
                              status={order.status}
                            />

                            {paymentStatus !== 'PAID' &&
                              orderStatus !==
                                'CANCELLED' && (
                                <span className="shrink-0 rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                                  Payment{' '}
                                  {paymentStatus
                                    .toLowerCase()
                                    .replaceAll(
                                      '_',
                                      ' '
                                    )}
                                </span>
                              )}
                          </div>

                          {/* Products */}
                          <p className="font-sora line-clamp-2 text-sm text-charcoal sm:line-clamp-1">
                            {order.items
                              ?.slice(0, 2)
                              .map(
                                (item) =>
                                  item.product?.name ??
                                  'Product'
                              )
                              .join(', ')}

                            {order.items?.length > 2 && (
                              <span className="text-ink">
                                {' '}
                                +{order.items.length - 2}{' '}
                                more
                              </span>
                            )}
                          </p>

                          {/* Meta */}
                          <div className="font-worksans mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink">
                            <span>
                              📅{' '}
                              {formatDate(
                                order.createdAt
                              ) ?? 'Date unavailable'}
                            </span>

                            <span>
                              📦 {order.items?.length ?? 0}{' '}
                              items
                            </span>

                            <span>
                              💳{' '}
                              {formatPaymentMethod(
                                order.paymentMethod
                              )}
                            </span>
                          </div>

                          {/* Address */}
                          <div className="mt-2 flex items-start gap-1.5 text-xs text-ink">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                            <span className="line-clamp-2">
                              {formatShippingAddress(order)}
                            </span>
                          </div>

                          {/* Delivery */}
                          <div className="mt-1 flex items-start gap-1.5 text-xs text-ink">
                            <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                            {deliveredLabel ? (
                              <span>
                                Delivered on{' '}
                                {deliveredLabel}
                              </span>
                            ) : estimatedLabel ? (
                              <span>
                                Estimated delivery:{' '}
                                {estimatedLabel}
                              </span>
                            ) : (
                              <span>
                                Delivery date not
                                available yet
                              </span>
                            )}
                          </div>

                          {/* Tracking */}
                          {order.trackingNumber && (
                            <div className="mt-2 text-xs font-medium text-brand">
                              Tracking:{' '}
                              {order.trackingNumber}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="font-sora flex items-center justify-between sm:block sm:text-right">
                        <p className="text-xs tracking-wide text-ink">
                          Total
                        </p>

                        <p className="text-xl font-bold text-brand sm:text-2xl">
                          {formatCurrency(
                            Number(order.total || 0)
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="font-worksans flex flex-wrap gap-2 border-t bg-gray-50 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">

                      <Button
                        className="bg-white text-xs text-black shadow"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/orders/${order.id}`
                          )
                        }
                      >
                        View Details
                      </Button>

                      <Button
                        size="sm"
                        className="bg-brand text-xs text-white hover:bg-orange-600"
                        onClick={() =>
                          router.push(
                            `/orders/${order.id}#tracking`
                          )
                        }
                      >
                        <Truck className="mr-1.5 h-3.5 w-3.5" />
                        Track Order
                      </Button>

                      <Button
                        className="bg-white text-xs text-black shadow"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast.success(
                            'Invoice download will be available soon.'
                          );
                        }}
                      >
                        Download Invoice
                      </Button>

                      <Button
                        className="bg-white text-xs text-black shadow"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast.success(
                            'Reorder feature will be available soon.'
                          );
                        }}
                      >
                        Reorder
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </main>
  );
}