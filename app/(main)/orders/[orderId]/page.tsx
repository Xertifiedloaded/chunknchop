'use client';

import { use, useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, MapPin, Clock3, Truck, ArrowRight, Loader2, Check, Package, Box, House } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

interface Props {
  params: Promise<{
    orderId: string;
  }>;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  pricePerUnit: number;
  tier: string | null;
  variants: unknown;
  product: {
    id: string;
    name: string;
    images?: string[] | null;
  };
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount?: number | null;
  total: number;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  createdAt: string;
  items: OrderItem[];
}

type FetchState = 'loading' | 'unauthorized' | 'notfound' | 'error' | 'ready';

const STATUS_STEPS = ['PENDING', 'PREPARING', 'PACKAGED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const STATUS_LABELS = ['Order Received', 'Preparing', 'Packaging', 'Out for Delivery', 'Delivered'];

const STATUS_ICONS = [Check, Package, Box, Truck, House];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

export default function OrderPage({ params }: Props) {
  const { orderId } = use(params);
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>('loading');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !accessToken) {
      return;
    }

    let cancelled = false;

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/customer/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        });

        if (cancelled) return;

        if (res.status === 401) {
          setFetchState('unauthorized');
          return;
        }

        if (res.status === 404) {
          setFetchState('notfound');
          return;
        }

        // Guard against non-JSON responses
        const contentType = res.headers.get('content-type') || '';

        if (!contentType.includes('application/json')) {
          const text = await res.text();

          console.error('Non-JSON response from order API:', text.slice(0, 500));

          setErrorDetail('Server returned an unexpected response format.');

          setFetchState('error');
          return;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => null);

          console.error('Order API error:', res.status, body);

          setErrorDetail(body?.error ?? `Request failed (${res.status})`);

          setFetchState('error');
          return;
        }

        const data = await res.json();

        setOrder(data.order);
        setFetchState('ready');
      } catch (err) {
        console.error('Failed to fetch order:', err);

        if (!cancelled) {
          setErrorDetail(err instanceof Error ? err.message : 'Unknown error');

          setFetchState('error');
        }
      }
    }

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [user, accessToken, orderId]);

  useEffect(() => {
    if (fetchState === 'unauthorized') {
      router.replace(`/login?next=/orders/${orderId}`);
    }
  }, [fetchState, orderId, router]);

  if (fetchState === 'loading' || fetchState === 'unauthorized') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="text-brand h-8 w-8 animate-spin" />
      </main>
    );
  }

  if (fetchState === 'notfound') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-4 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Order not found</h1>

        <p className="text-ink text-sm">We couldn't find an order with that ID.</p>

        <Link href="/orders" className="bg-brand rounded-lg px-6 py-3 text-sm font-medium text-white">
          View your orders
        </Link>
      </main>
    );
  }

  if (fetchState === 'error' || !order) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-4 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Something went wrong</h1>

        <p className="text-ink text-sm">We couldn't load this order. Please try again.</p>

        {process.env.NODE_ENV === 'development' && errorDetail && <p className="max-w-md text-sm text-red-500">{errorDetail}</p>}

        <button onClick={() => window.location.reload()} className="bg-brand rounded-lg px-6 py-3 text-sm font-medium text-white">
          Retry
        </button>
      </main>
    );
  }

  const currentStepIndex = Math.max(STATUS_STEPS.indexOf(order.status), 0);

  const fullAddress = [order.shippingAddress, order.shippingCity].filter(Boolean).join(', ');

  const region = [order.shippingState, order.shippingCountry].filter(Boolean).join(', ');

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Success */}
        <section className="text-center">
          <div className="bg-brand mx-auto flex h-16 w-16 items-center justify-center rounded-full shadow-lg sm:h-20 sm:w-20 lg:h-24 lg:w-24">
            <CheckCircle2 className="h-7 w-7 text-white sm:h-8 sm:w-8 lg:h-10 lg:w-10" />
          </div>

          <h1 className="font-sora mt-4 text-2xl font-bold capitalize sm:text-3xl">Order Confirmed!</h1>

          <p className="text-charcoal font-worksans mx-auto mt-3 max-w-xl text-sm sm:mt-4">Thank you for shopping with ChunkNChop. We're preparing your order.</p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href={`/orders/${orderId}/track`} className="bg-brand rounded-lg px-5 py-3 text-xs font-medium text-white">
              Track Order
            </Link>

            <Link href="/shop" className="rounded-lg border bg-white px-6 py-3 text-sm font-medium shadow">
              Continue Shopping
            </Link>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 text-sm sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          <Card icon={<Clock3 className="h-4 w-4 sm:h-5 sm:w-5" />} title="Order Number" value={order.id} sub={`Placed ${formatDate(order.createdAt)}`} />

          <Card icon={<CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />} title="Payment" value={order.paymentStatus === 'PAID' ? 'Payment Successful' : order.paymentStatus} sub={order.paymentStatus} />

          <Card icon={<Truck className="h-4 w-4 sm:h-5 sm:w-5" />} title="Order Status" value={STATUS_LABELS[currentStepIndex] ?? order.status} sub="Cold-chain tracked" />

          <Card icon={<MapPin className="h-4 w-4 sm:h-5 sm:w-5" />} title="Delivery Address" value={fullAddress || '—'} sub={region || '—'} />
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:mt-10 sm:p-6 lg:p-8">
          <h2 className="text-lg font-semibold">Delivery timeline</h2>

          <p className="text-ink mt-1 text-sm">Cold-chain tracked from our facility to your door.</p>

          <div className="relative mt-8 sm:mt-10">
            {(() => {
              const stepCount = STATUS_LABELS.length;
              const inset = 100 / (stepCount * 2);
              const trackWidth = 100 - inset * 2;

              return (
                <>
                  <div className="absolute top-4.5 h-0.5 bg-gray-200 sm:top-6 lg:top-7" style={{ left: `${inset}%`, right: `${inset}%` }} />
                  <div
                    className="bg-brand absolute top-4.5 h-0.5 transition-all duration-500 sm:top-6 lg:top-7"
                    style={{
                      left: `${inset}%`,
                      width: currentStepIndex === 0 ? '0%' : `${(currentStepIndex / (stepCount - 1)) * trackWidth}%`,
                    }}
                  />
                </>
              );
            })()}

            <div className="relative grid grid-cols-5 gap-x-1 sm:gap-x-2">
              {STATUS_LABELS.map((step, index) => {
                const Icon = STATUS_ICONS[index];
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isPending = index > currentStepIndex;

                return (
                  <div key={step} className="flex min-w-0 flex-col items-center px-0.5 text-center">
                    <div className={['relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 sm:h-12 sm:w-12 lg:h-14 lg:w-14', isCompleted ? 'bg-brand text-white' : isCurrent ? 'border-brand/20 bg-brand border-4 text-white' : 'border border-gray-200 bg-gray-100 text-gray-400'].join(' ')}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" strokeWidth={isCompleted || isCurrent ? 2.5 : 2} />
                    </div>

                    <p className={['mt-2 w-full text-[9px] leading-tight font-medium break-words sm:mt-3 sm:text-sm', isPending ? 'text-gray-400' : 'text-gray-900'].join(' ')}>{step}</p>

                    <p className={['mt-1 hidden w-full text-[10px] leading-tight break-words sm:block sm:text-xs', isPending ? 'text-gray-400' : 'text-gray-500'].join(' ')}>
                      {index === 0 && `Today, ${formatTime(order.createdAt)}`}
                      {index === 1 && (currentStepIndex >= 1 ? 'Today, 11:50 AM' : 'Est. 11:50 AM')}
                      {index === 2 && 'Est. 12:20 PM'}
                      {index === 3 && 'Est. 1:10 PM'}
                      {index === 4 && 'Est. 2:00 PM'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 sm:mt-10 sm:gap-8 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6 lg:col-span-2 lg:p-8">
            <h2 className="mb-4 text-2xl font-semibold sm:mb-6">Order Items</h2>

            <div className="space-y-4 sm:space-y-5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 border-b pb-4 last:border-b-0">
                  <div className="flex min-w-0 gap-3 sm:gap-4">
                    {item.product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.images[0]} alt={item.product.name} className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-20 sm:w-20" />
                    ) : (
                      <div className="bg-ink h-14 w-14 shrink-0 rounded-lg sm:h-20 sm:w-20" />
                    )}

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">{item.product.name}</h3>

                      {item.tier && <p className="text-ink text-xs sm:text-sm">Tier: {item.tier}</p>}

                      <p className="text-ink text-xs">Quantity: {item.quantity}</p>
                    </div>
                  </div>

                  <p className="shrink-0 text-sm font-semibold">{formatCurrency(item.pricePerUnit * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <h2 className="mb-4 text-base font-semibold sm:mb-6 sm:text-lg lg:text-xl">Payment Summary</h2>

            <SummaryRow title="Subtotal" value={formatCurrency(order.subtotal)} />

            <SummaryRow title="Tax" value={formatCurrency(order.tax)} />

            <SummaryRow title="Delivery" value={order.shipping === 0 ? 'Free' : formatCurrency(order.shipping)} />

            {!!order.discount && <SummaryRow title="Discount" value={`-${formatCurrency(order.discount)}`} />}

            <hr className="my-4 sm:my-5" />

            <SummaryRow title="Total" value={formatCurrency(order.total)} bold />

            <button className="bg-brand mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-white sm:mt-8">
              Download Invoice
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="text-ink mb-2 flex items-center gap-2 text-sm">
        {icon}
        <span>{title}</span>
      </div>

      <h3 className="truncate text-sm font-semibold">{value}</h3>

      <p className="text-ink mt-1 text-xs sm:mt-2 sm:text-sm">{sub}</p>
    </div>
  );
}

function SummaryRow({ title, value, bold }: { title: string; value: string; bold?: boolean }) {
  return (
    <div className="mb-3 flex justify-between text-sm sm:mb-4">
      <span>{title}</span>

      <span className={bold ? 'font-bold' : ''}>{value}</span>
    </div>
  );
}

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString));
}
