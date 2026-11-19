'use client';

import { useCallback, useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Home,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  PackageCheck,
  Phone,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';

import OrderChat from '@/components/delivery/order-chat';

type Props = {
  orderNumber: string;
  paymentNotice?: string;
};

type TrackingItem = {
  id?: string;
  productId?: string;
  slug?: string;
  name: string;
  imageUrl?: string | null;
  quantity?: number;
  unit?: string;
  price?: number;
  unitPrice?: number;
  totalPrice?: number;
};

type RiderLocation = {
  latitude: number;
  longitude: number;
  updatedAt: string;
};

type Rider = {
  id?: string;
  name?: string;
  phone?: string | null;
  phoneNumber?: string;
  vehicle?: string;
  vehicleType?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  plateNumber?: string;
  rating?: number;
  imageUrl?: string | null;
  location?: RiderLocation | null;
} | null;

type Delivery = {
  addressLine1?: string;
  addressLine2?: string;
  checkoutRequestId?: string;
  city?: string;
  couponCode?: string;
  deliveryDate?: string;
  deliveryMethod?: string;
  deliveryNotes?: string;
  deliveryWindow?: string;
  fullName?: string;
  phone?: string;
  postalCode?: string;
  region?: string;
  state?: string;
};

type Tracking = {
  id?: string;
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  items?: TrackingItem[];

  total?: number | null;
  totalAmount?: number | null;
  totalPaid?: number | null;
  orderTotal?: number | null;
  subtotal?: number | null;
  itemsSubtotal?: number | null;
  deliveryFee?: number | null;
  discount?: number | null;
  productDiscount?: number | null;
  couponDiscount?: number | null;

  orderTotalCents?: number | null;
  totalPaidCents?: number | null;

  currency?: string;
  rider?: Rider;
  delivery?: Delivery | null;
  customer?: {
    name?: string;
    phone?: string;
  };
  statusHistory?: unknown[];
};

const timeline = [
  { key: 'payment_pending', label: 'Order Received', icon: Check },
  { key: 'paid', label: 'Preparing', icon: ShoppingBag },
  { key: 'assigned', label: 'Packaging', icon: Package },
  { key: 'out_for_delivery', label: 'On the Way', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

const statusIndex: Record<string, number> = {
  payment_pending: 0,
  pending: 0,
  paid: 1,
  confirmed: 1,
  preparing: 1,
  assigned: 2,
  picked_up: 3,
  out_for_delivery: 3,
  delivered: 4,
};

const successfulPaymentStatuses = ['paid', 'success', 'successful', 'completed'];

function isPaymentSuccessful(status?: string) {
  return successfulPaymentStatuses.includes((status ?? '').toLowerCase());
}

function money(amount?: number | null, currency = 'NGN') {
  if (amount === undefined || amount === null || !Number.isFinite(amount)) {
    return '—';
  }

  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₦${amount.toLocaleString('en-NG')}`;
  }
}

function getItemQuantity(item: TrackingItem) {
  return typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
}

function getItemUnitPrice(item: TrackingItem) {
  if (typeof item.unitPrice === 'number') {
    return item.unitPrice;
  }

  if (typeof item.price === 'number') {
    return item.price;
  }

  if (typeof item.totalPrice === 'number') {
    return item.totalPrice / getItemQuantity(item);
  }

  return undefined;
}

function getItemPrice(item: TrackingItem) {
  if (typeof item.totalPrice === 'number') {
    return item.totalPrice;
  }

  const unitPrice = getItemUnitPrice(item);

  return unitPrice !== undefined ? unitPrice * getItemQuantity(item) : undefined;
}

function ProductImage({ src, name }: { src?: string | null; name: string }) {
  return (
    <div className="size-14.5 shrink-0 overflow-hidden rounded-lg border border-[#eee9e5] bg-[#faf8f6]">
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="grid h-full w-full place-items-center text-[#c4b9b1]">
          <ShoppingBag size={22} />
        </div>
      )}
    </div>
  );
}

function RiderAvatar({ src, name }: { src?: string | null; name?: string }) {
  return (
    <div className="relative size-12 shrink-0">
      <div className="size-12 overflow-hidden rounded-xl border border-[#eee9e5] bg-[#faf8f6]">
        {src ? (
          <img src={src} alt={name || 'Delivery rider'} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[#fff0e9] text-brand">
            <Truck size={20} />
          </div>
        )}
      </div>

      {src && (
        <span className="absolute -right-1 -bottom-1 size-3 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cancelled = status === 'cancelled';
  const delivered = status === 'delivered';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[10px] font-semibold capitalize ${
        cancelled
          ? 'bg-gray-100 text-gray-600'
          : delivered
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-[#fff0e9] text-brand'
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          cancelled ? 'bg-gray-400' : delivered ? 'bg-emerald-500' : 'bg-[#ed7044]'
        }`}
      />
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName = '',
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[10px] text-[#77736d]">{label}</span>
      <span className={`text-right text-[10px] font-semibold text-[#292722] ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf9f7] px-4 py-10">
      <section className="w-full max-w-[420px] rounded-2xl border border-[#eee3dd] bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-red-600">
          <LockKeyhole size={28} />
        </div>

        <h1 className="mt-5 text-[20px] font-bold text-[#292722]">Access Denied</h1>

        <p className="mx-auto mt-2 max-w-[300px] text-[11px] leading-6 text-[#77736d]">
          You do not have permission to track this order. Only the customer who placed this order,
          the rider assigned to it, or an administrator can access its tracking information.
        </p>

        <div className="mt-6 rounded-lg bg-[#faf8f6] px-4 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-[#99938d]">
            Order number
          </p>
          <p className="mt-1 break-all text-[11px] font-bold text-[#292722]">
            Your access is restricted.
          </p>
        </div>

        <a
          href="/account/orders"
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ed6034] text-[11px] font-bold text-white transition hover:bg-[#d94e25]"
        >
          <ArrowLeft size={14} />
          Back to My Orders
        </a>

        <p className="mt-4 text-[9px] text-[#99938d]">
          If you believe this is a mistake, please contact support.
        </p>
      </section>
    </main>
  );
}

export default function OrderTracking({ orderNumber, paymentNotice }: Props) {
  const [data, setData] = useState<Tracking>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/tracking`, {
        cache: 'no-store',
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 403) {
        setAccessDenied(true);
        setError('');
        setData({});
        return;
      }

      if (response.status === 401) {
        window.location.href = `/sign-in?returnTo=${encodeURIComponent(
          `/account/orders/${orderNumber}/track`,
        )}`;
        return;
      }

      if (!response.ok) {
        setError(result.error ?? 'Unable to load tracking details.');
        return;
      }

      setAccessDenied(false);
      setData(result);
      setError('');
    } catch {
      setError('Unable to load tracking. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    void refresh();

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) return;

    const pusher = new Pusher(key, {
      cluster,
      channelAuthorization: {
        endpoint: '/api/pusher/auth',
        transport: 'ajax',
      },
    });

    const channelName = `private-order-${orderNumber}`;
    const channel = pusher.subscribe(channelName);

    channel.bind('delivery.location', (location: RiderLocation) => {
      setData((old) => ({
        ...old,
        rider: old.rider
          ? {
              ...old.rider,
              location,
            }
          : null,
      }));
    });

    channel.bind('delivery.status', () => {
      void refresh();
    });

    channel.bind('delivery.assigned', () => {
      void refresh();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [orderNumber, refresh]);

  useEffect(() => {
    if (!chatOpen && !issueOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setChatOpen(false);
        setIssueOpen(false);
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [chatOpen, issueOpen]);

  if (accessDenied) {
    return <AccessDenied />;
  }

  const delivery = data.delivery;

  const addressLines = [
    delivery?.addressLine1,
    delivery?.addressLine2,
    [delivery?.city, delivery?.region || delivery?.state].filter(Boolean).join(', '),
    delivery?.postalCode,
  ].filter(Boolean);

  const status = data.status ?? 'payment_pending';
  const currentIndex = statusIndex[status] ?? 0;
  const cancelled = status === 'cancelled';
  const delivered = status === 'delivered';

  const rider = data.rider;
  const location = rider?.location;

  const riderPhone = rider?.phone || rider?.phoneNumber || delivery?.phone;

  const items = data.items ?? [];
  const currency = data.currency ?? 'NGN';

  const paymentSuccessful = isPaymentSuccessful(data.paymentStatus);

  const total = data.totalPaid ?? data.orderTotal ?? data.totalAmount ?? data.total;

  const totalLabel = paymentSuccessful ? 'Total Paid' : 'Order Total';

  const subtotal = data.itemsSubtotal ?? data.subtotal;

  const productDiscount = data.productDiscount ?? 0;
  const couponDiscount = data.couponDiscount ?? 0;

  const combinedDiscount = data.discount ?? productDiscount + couponDiscount;

  const mapUrl = location
    ? `https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`
    : undefined;

  const estimatedArrival = delivered
    ? 'Your order has arrived'
    : cancelled
      ? 'This order was cancelled'
      : status === 'out_for_delivery' || status === 'picked_up'
        ? 'Your order is on the way'
        : 'We are preparing your order';

  const vehicleDescription = [
    rider?.vehicleBrand,
    rider?.vehicleModel,
    rider?.vehicleColor,
    rider?.vehicleType,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#faf9f7]">
      <div className="mx-auto w-[min(1120px,92%)] py-6 sm:py-8 lg:py-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1.5 text-[9px] font-bold tracking-[0.17em] text-[#ed7044]">
              TRACK ORDER
            </p>

            <h1 className="break-all text-[9px] font-bold leading-tight text-[#24231f] sm:text-[23px]">
              {orderNumber}
            </h1>

            <div className="mt-2">
              <StatusBadge status={status} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIssueOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#f1d9d1] bg-[#f8e5df] px-3 py-2.5 text-[10px] font-semibold text-[#6e3a2c] transition hover:bg-[#f3d8cf]"
          >
            <AlertCircle size={14} />
            Report an Issue
            <ArrowRight size={13} />
          </button>
        </header>

        {paymentNotice && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[10px] text-emerald-800">
            {paymentNotice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => void refresh()}
              className="shrink-0 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="rounded-xl border border-[#e9e7e3] bg-white px-4 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:px-6 sm:py-6">
          <div className="mb-7">
            <h2 className="text-[16px] font-bold tracking-tight text-[#282621]">
              Delivery timeline
            </h2>

            <p className="mt-1 text-[10px] font-medium text-[#ed7044]">{estimatedArrival}</p>
          </div>

          {cancelled ? (
            <div className="rounded-lg bg-gray-50 px-4 py-5 text-center text-[11px] text-gray-600">
              This order has been cancelled.
            </div>
          ) : (
            <div className="relative">
              <div className="absolute top-[17px] right-[8%] left-[8%] h-px bg-[#e6e7eb]" />

              <div
                className="absolute top-[17px] left-[8%] h-px bg-[#ed7044] transition-all duration-500"
                style={{
                  width: `${(currentIndex / 4) * 84}%`,
                }}
              />

              <div className="relative grid grid-cols-5 gap-1">
                {timeline.map((step, index) => {
                  const complete = index <= currentIndex;
                  const active = index === currentIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex min-w-0 flex-col items-center text-center">
                      <div
                        className={`relative z-[1] grid size-[35px] place-items-center rounded-full border ${
                          complete
                            ? 'border-[#ed7044] bg-[#ed7044] text-white'
                            : 'border-[#e5e7eb] bg-[#f5f6f8] text-[#a5acb8]'
                        } ${active ? 'ring-4 ring-[#ed7044]/10' : ''}`}
                      >
                        <Icon size={15} />
                      </div>

                      <p
                        className={`mt-2.5 max-w-[90px] text-[8px] font-semibold leading-4 sm:text-[9px] ${
                          complete ? 'text-[#292722]' : 'text-[#a0a5b0]'
                        }`}
                      >
                        {step.label}
                      </p>

                      <p className="mt-1 hidden text-[8px] leading-3 text-[#9ca3af] sm:block">
                        {active ? 'In progress' : complete ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="mt-5 grid min-w-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.85fr)_minmax(290px,0.95fr)]">
          <article className="min-w-0 rounded-xl border border-[#f0d4ca] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#f0e7e2] pb-3">
              <h2 className="text-[16px] font-bold text-[#292722]">Order Details</h2>

              <span className="max-w-full truncate rounded-sm bg-[#f7e3dc] px-2 py-1 text-[9px] font-semibold text-[#74564d]">
                #{orderNumber}
              </span>
            </div>

            {loading && items.length === 0 ? (
              <div className="flex items-center gap-3 py-4 text-[11px] text-[#85817d]">
                <Package size={19} />
                Loading order items...
              </div>
            ) : items.length > 0 ? (
              <div>
                {items.map((item, index) => (
                  <div
                    key={item.id ?? item.productId ?? item.slug ?? `${item.name}-${index}`}
                    className="flex min-w-0 items-center gap-3 border-b border-dashed border-[#eee3dd] py-3 first:pt-0 last:border-b-0"
                  >
                    <ProductImage src={item.imageUrl} name={item.name} />

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-[11px] font-semibold text-[#292722]">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-[9px] text-[#85817d]">
                        Qty: {getItemQuantity(item)}
                        {item.unit ? ` · ${item.unit}` : ''}
                      </p>

                      {getItemUnitPrice(item) !== undefined && (
                        <p className="mt-1 text-[9px] text-[#99938d]">
                          {money(getItemUnitPrice(item), currency)} each
                        </p>
                      )}
                    </div>

                    <p className="shrink-0 text-right text-[10px] font-bold text-[#292722]">
                      {money(getItemPrice(item), currency)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 py-4 text-[11px] text-[#85817d]">
                <PackageCheck size={19} />
                No order items were found.
              </div>
            )}

            <div className="mt-3 border-t border-[#eee3dd] pt-3">
              {subtotal !== undefined && subtotal !== null && (
                <SummaryRow label="Items subtotal" value={money(subtotal, currency)} />
              )}

              {productDiscount > 0 && (
                <SummaryRow
                  label="Product discount"
                  value={`-${money(productDiscount, currency)}`}
                  valueClassName="text-emerald-700"
                />
              )}

              {couponDiscount > 0 && (
                <SummaryRow
                  label="Coupon discount"
                  value={`-${money(couponDiscount, currency)}`}
                  valueClassName="text-emerald-700"
                />
              )}

              {combinedDiscount > 0 && productDiscount === 0 && couponDiscount === 0 && (
                <SummaryRow
                  label="Discount"
                  value={`-${money(combinedDiscount, currency)}`}
                  valueClassName="text-emerald-700"
                />
              )}

              {data.deliveryFee !== undefined && data.deliveryFee !== null && (
                <SummaryRow label="Delivery fee" value={money(data.deliveryFee, currency)} />
              )}

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#eee3dd] pt-3">
                <div>
                  <span className="text-[10px] font-semibold text-[#77736d]">{totalLabel}</span>

                  {!paymentSuccessful && (
                    <p className="mt-1 text-[8px] text-amber-600">Awaiting payment confirmation</p>
                  )}
                </div>

                <strong className="text-[20px] font-extrabold tracking-tight text-[#b94319] sm:text-[22px]">
                  {loading && total === undefined ? 'Loading...' : money(total, currency)}
                </strong>
              </div>
            </div>

            {data.paymentStatus && (
              <div className="mt-2 flex items-center justify-end gap-1.5 text-[9px] text-[#77736d]">
                <CreditCard size={12} />
                Payment:{' '}
                <span
                  className={
                    paymentSuccessful
                      ? 'font-semibold text-emerald-700'
                      : 'font-semibold text-amber-600'
                  }
                >
                  {data.paymentStatus.replaceAll('_', ' ')}
                </span>
              </div>
            )}
          </article>

          <div className="flex min-w-0 flex-col gap-4">
            <article className="rounded-xl border border-[#f0d4ca] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:p-5">
              <p className="mb-4 text-[9px] font-semibold tracking-[0.08em] text-[#77736d]">
                DELIVERY ADDRESS
              </p>

              <div className="flex items-start gap-3">
                <MapPin size={17} className="mt-0.5 shrink-0 text-[#c34a20]" />

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#292722]">
                    {delivery?.fullName || 'Delivery Address'}
                  </p>

                  {addressLines.length > 0 ? (
                    addressLines.map((line, index) => (
                      <p
                        key={`${line}-${index}`}
                        className="mt-1 break-words text-[10px] leading-4 text-[#77736d]"
                      >
                        {line}
                      </p>
                    ))
                  ) : (
                    <p className="mt-1 text-[10px] text-[#99938d]">
                      Delivery address will appear here.
                    </p>
                  )}

                  {delivery?.phone && (
                    <p className="mt-2 text-[9px] text-[#77736d]">
                      Phone:{' '}
                      <a href={`tel:${delivery.phone}`} className="font-semibold text-[#292722]">
                        {delivery.phone}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {delivery?.deliveryWindow && (
                <div className="mt-4 border-t border-[#f0e7e2] pt-3">
                  <p className="text-[9px] text-[#85817d]">Delivery window</p>

                  <p className="mt-1 text-[10px] font-semibold text-[#292722]">
                    {delivery.deliveryWindow}
                  </p>
                </div>
              )}

              {delivery?.deliveryNotes && (
                <div className="mt-3 rounded-lg bg-[#faf8f6] p-3">
                  <p className="text-[9px] font-semibold text-[#77736d]">DELIVERY NOTES</p>

                  <p className="mt-1 text-[10px] leading-5 text-[#292722]">
                    {delivery.deliveryNotes}
                  </p>
                </div>
              )}
            </article>

            <article className="flex-1 rounded-xl border border-[#f0d4ca] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sm:p-5">
              <p className="mb-4 text-[9px] font-semibold tracking-[0.08em] text-[#77736d]">
                DELIVERY PARTNER
              </p>

              <div className="flex min-w-0 items-center gap-3">
                <RiderAvatar src={rider?.imageUrl} name={rider?.name} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-[#292722]">
                    {rider?.name ?? 'Awaiting rider assignment'}
                  </p>

                  <p className="mt-1 text-[9px] text-[#77736d]">
                    {vehicleDescription || 'Delivery Partner'}
                  </p>

                  {rider?.plateNumber && (
                    <p className="mt-1 text-[9px] text-[#77736d]">Plate: {rider.plateNumber}</p>
                  )}

                  {rider?.rating !== undefined && (
                    <p className="mt-1 text-[9px] text-[#77736d]">
                      ★ {rider.rating} · Delivery Rider
                    </p>
                  )}
                </div>

                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f9e5dd] text-[#ed7044]">
                  <Truck size={16} />
                </div>
              </div>

              {riderPhone && (
                <p className="mt-3 break-words text-[9px] text-[#77736d]">
                  Rider number:{' '}
                  <a
                    href={`tel:${riderPhone}`}
                    className="font-semibold text-[#292722] hover:text-[#ed7044]"
                  >
                    {riderPhone}
                  </a>
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href={riderPhone ? `tel:${riderPhone}` : undefined}
                  onClick={(event) => {
                    if (!riderPhone) event.preventDefault();
                  }}
                  className={`flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#f0d4ca] text-[9px] font-semibold transition ${
                    riderPhone
                      ? 'text-[#292722] hover:bg-[#fff6f2]'
                      : 'cursor-not-allowed text-gray-400'
                  }`}
                >
                  <Phone size={12} />
                  Call Rider
                </a>

                <button
                  type="button"
                  onClick={() => setChatOpen(true)}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#ed6034] text-[9px] font-semibold text-white transition hover:bg-[#d94e25]"
                >
                  <MessageCircle size={12} />
                  Message
                </button>
              </div>
            </article>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-xl border border-[#f0d4ca] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e7e2] px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-[14px] font-bold text-[#292722]">Live Delivery Location</h2>

              <p className="mt-1 text-[9px] text-[#85817d]">
                {location
                  ? 'Showing your rider’s latest GPS position.'
                  : 'The map will update when your rider shares their location.'}
              </p>
            </div>

            {location && (
              <a
                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-[#d85229] hover:underline"
              >
                <Navigation size={12} />
                Open in Maps
              </a>
            )}
          </div>

          <div className="relative h-[260px] bg-[#f2efeb] sm:h-[370px]">
            {mapUrl ? (
              <iframe
                title="Live rider location"
                className="h-full w-full border-0"
                src={mapUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                <div className="grid size-12 place-items-center rounded-full bg-white text-[#ed7044] shadow-sm">
                  <MapPin size={22} />
                </div>

                <h3 className="mt-3 text-[12px] font-bold text-[#292722]">
                  Waiting for rider location
                </h3>

                <p className="mt-1 max-w-[260px] text-[10px] leading-5 text-[#85817d]">
                  Once your delivery rider starts sharing GPS, their location will appear here.
                </p>
              </div>
            )}

            {location && (
              <div className="absolute bottom-3 left-3 rounded-lg border border-[#eee9e5] bg-white/95 px-3 py-2 shadow-sm">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold text-[#292722]">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Rider location updated
                </p>

                <p className="mt-1 text-[8px] text-[#85817d]">
                  {new Date(location.updatedAt).toLocaleTimeString('en-NG')}
                </p>
              </div>
            )}
          </div>
        </section>

        <p className="mt-5 text-center text-[9px] text-[#99938d]">
          Thank you for choosing ChunkNChop. We appreciate your order.
        </p>
      </div>

      {chatOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 sm:justify-start sm:p-5"
          onClick={() => setChatOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delivery chat"
            className="flex h-auto max-h-[80dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-200 sm:max-h-[min(600px,calc(100dvh-2.5rem))] sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 bg-[#ed6034] px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white/15 text-white">
                  {rider?.imageUrl ? (
                    <img
                      src={rider.imageUrl}
                      alt={rider.name || 'Delivery rider'}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Truck size={18} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold text-white">
                    {rider?.name ?? 'Delivery Support'}
                  </p>

                  <p className="mt-0.5 text-[9px] text-white/80">
                    {rider ? 'Your delivery partner' : 'Order support'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setChatOpen(false)}
                aria-label="Close chat"
                className="grid size-8 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/15"
              >
                <X size={17} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#faf9f7]">
              <div className="w-full min-w-0">
                <OrderChat orderNumber={orderNumber} />
              </div>
            </div>
          </div>
        </div>
      )}

      {issueOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-black/40 p-3 sm:items-center sm:p-4"
          onClick={() => setIssueOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="issue-title"
            className="my-0 w-full max-w-[360px] rounded-t-2xl bg-white p-5 shadow-xl sm:my-auto sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-3 grid size-10 place-items-center rounded-xl bg-red-50 text-red-600">
                  <AlertCircle size={19} />
                </div>

                <h2 id="issue-title" className="text-[15px] font-bold text-[#292722]">
                  Need help with your order?
                </h2>

                <p className="mt-1 text-[10px] leading-5 text-[#85817d]">
                  Contact your delivery partner through chat or call, or reach out to the support
                  team.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIssueOpen(false)}
                aria-label="Close issue dialog"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIssueOpen(false);
                  setChatOpen(true);
                }}
                className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#ed6034] text-[10px] font-semibold text-white hover:bg-[#d94e25]"
              >
                <MessageCircle size={13} />
                Chat Rider
              </button>

              <button
                type="button"
                onClick={() => {
                  setIssueOpen(false);

                  if (riderPhone) {
                    window.location.href = `tel:${riderPhone}`;
                  }
                }}
                disabled={!riderPhone}
                className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#eee3dd] text-[10px] font-semibold text-[#292722] hover:bg-[#faf8f6] disabled:opacity-50"
              >
                <Phone size={13} />
                Call Rider
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
