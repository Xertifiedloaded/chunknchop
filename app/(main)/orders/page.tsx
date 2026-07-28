
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Package, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';

interface OrderItem {
  productId: string;
  quantity: number;
  pricePerUnit: number;
  tier: string | null;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();

  const { user, accessToken } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


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
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
      toast.error('Your session has expired. Please sign in again.');
      router.push('/auth/login?redirect=/orders');
      return;
    }

    if (!response.ok) {
      throw new Error(
        data?.error || 'Failed to load your orders'
      );
    }

    setOrders(
      Array.isArray(data?.orders)
        ? data.orders
        : []
    );
  } catch (error) {
    console.error('Error fetching orders:', error);

    setError(
      error instanceof Error
        ? error.message
        : 'Failed to load your orders'
    );

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
  }, [user, accessToken, router, fetchOrders]);

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-charcoal transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                My Orders
              </h1>

              <p className="mt-1 text-sm text-charcoal">
                View and track your recent orders.
              </p>
            </div>

            {!loading && orders.length > 0 && (
              <span className="text-sm text-charcoal">
                {orders.length}{' '}
                {orders.length === 1 ? 'order' : 'orders'}
              </span>
            )}
          </div>
        </div>
        {loading && (
          <div className="flex min-h-75 items-center justify-center rounded-2xl border bg-card">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />

              <p className="text-sm text-charcoal">
                Loading your orders...
              </p>
            </div>
          </div>
        )}
        {!loading && error && (
          <div className="rounded-2xl border border-destructive/20 bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <Package className="h-7 w-7 text-destructive" />
            </div>

            <h2 className="text-lg font-semibold">
              Unable to load orders
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-charcoal">
              We couldn&apos;t retrieve your orders right now.
              Please try again.
            </p>

            <Button
              onClick={fetchOrders}
              className="mt-5"
            >
              Try Again
            </Button>
          </div>
        )}
        {!loading && !error && orders.length === 0 && (
          <div className="rounded-2xl text-white border bg-card px-6 py-16 text-center shadow-sm sm:px-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
              <ShoppingBag className="h-8 w-8 text-brand" />
            </div>

            <h2 className="text-xl font-semibold">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 ">
              You haven&apos;t placed any orders yet. Browse our
              products and place your first order today.
            </p>

            <Link href="/" className="mt-6 text-xs inline-block">
              <Button>
                Start Shopping
              </Button>
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border bg-card shadow-sm"
              >
                <div className="border-b bg-muted/30 p-5 sm:p-6">
                  <div className="grid gap-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-charcoal">
                        Order Number
                      </p>

                      <p className="mt-1 font-mono text-sm font-bold sm:text-base">
                        {order.orderNumber}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-charcoal">
                        Status
                      </p>

                      <span className="mt-1 inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-medium capitalize text-brand">
                        {order.status.toLowerCase()}
                      </span>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-charcoal">
                        Total
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <p className="mb-4 text-sm font-semibold">
                    Order Items
                  </p>

                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {item.product.name}
                          </p>

                          <p className="mt-1 text-xs text-charcoal">
                            {item.tier && `${item.tier} · `}
                            Qty: {item.quantity}
                          </p>
                        </div>

                        <p className="shrink-0 font-medium">
                          $
                          {(
                            item.pricePerUnit *
                            item.quantity
                          ).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-4 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-xs text-charcoal">
                    Placed on{' '}
                    {new Date(
                      order.createdAt
                    ).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/orders/${order.id}`)
                    }
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

