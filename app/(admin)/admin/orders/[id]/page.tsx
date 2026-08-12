'use client';

import { ArrowLeft, Check, ChevronDown, Clock3, FileText, Mail, MapPin, Phone, Printer, RefreshCcw, Search, Truck, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { fetchWithAuth } from '@/lib/fetchClient';

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  image: string | null;
  images: string[];
  quantity: number;
  pricePerUnit: number;
  tier: string | null;
};

type OrderCustomer = {
  id: string;
  name: string;
  email: string;
};

type OrderRider = {
  id: string;
  name: string;
  phone: string;
  status: string;
};

type OrderAddress = {
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

type OrderDelivery = {
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  zone: string;
  assignedRider: OrderRider | null;
};

type Order = {
  id: string;
  orderNumber: string;

  status: string;
  paymentStatus: string;

  createdAt: string;

  total: number;
  subtotal: number;
  tax: number;
  shipping: number;

  customer: OrderCustomer;

  customerName: string;
  customerEmail: string;

  itemsCount: number;
  productSummary: string;

  items: OrderItem[];

  location: string;

  customerAddress: OrderAddress;

  delivery: OrderDelivery;

  rider: OrderRider | null;

  trackingNumber: string | null;
  estimatedDelivery: string | null;
};

type FetchState = {
  orderId: string;
  order: Order | null;
  error: string | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date));
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getStatusStyles(status: string) {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'PENDING':
      return {
        wrapper: 'bg-[#fff4dc] text-[#d98700]',
        dot: 'bg-[#f5a800]',
      };

    case 'PREPARING':
      return {
        wrapper: 'bg-[#fff0eb] text-[#e65326]',
        dot: 'bg-[#ee5a31]',
      };

    case 'QUALITY_CHECK':
      return {
        wrapper: 'bg-[#fbecef] text-[#731d36]',
        dot: 'bg-[#8b2542]',
      };

    case 'PACKAGING':
      return {
        wrapper: 'bg-[#eceae8] text-[#514d49]',
        dot: 'bg-[#89847f]',
      };

    case 'READY_FOR_DISPATCH':
      return {
        wrapper: 'bg-[#e8f6ff] text-[#007ac1]',
        dot: 'bg-[#119ee6]',
      };

    case 'OUT_FOR_DELIVERY':
      return {
        wrapper: 'bg-[#e7f6ff] text-[#007cc3]',
        dot: 'bg-[#119ee6]',
      };

    case 'DELIVERED':
      return {
        wrapper: 'bg-[#e5faef] text-[#00854f]',
        dot: 'bg-[#12bd65]',
      };

    case 'CANCELLED':
      return {
        wrapper: 'bg-[#fff0f0] text-[#ed3d3d]',
        dot: 'bg-[#ff4c4c]',
      };

    default:
      return {
        wrapper: 'bg-[#f1efed] text-[#635d58]',
        dot: 'bg-[#89847f]',
      };
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles = getStatusStyles(status);

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[9px] font-semibold ${styles.wrapper}`}>
      <span className={`h-[5px] w-[5px] rounded-full ${styles.dot}`} />

      {formatStatus(status)}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const paid = status.toUpperCase() === 'PAID' || status.toUpperCase() === 'COMPLETED';

  return <span className={`rounded-full px-2 py-[3px] text-[9px] font-semibold ${paid ? 'bg-[#e7f8ef] text-[#008a51]' : 'bg-[#fff0f0] text-[#e93636]'}`}>{status.toLowerCase()}</span>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] text-[#928b85]">{label}</span>

      <span className="text-right text-[10px] font-medium text-[#403b37]">{value}</span>
    </div>
  );
}

function DocumentRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button type="button" className="flex h-[36px] w-full items-center gap-2 rounded-[11px] border border-[#ebe7e4] px-3 text-left text-[9px] text-[#47423e] hover:bg-[#faf9f8]">
      <span className="text-[#85807b]">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function LoadingPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="h-[45px] border-b border-[#e8e8e8] bg-white" />

      <main className="px-3 pt-6 pb-8 sm:px-4">
        <div className="mb-5">
          <div className="h-3 w-20 animate-pulse rounded bg-[#e8e5e2]" />

          <div className="mt-3 h-7 w-40 animate-pulse rounded bg-[#e8e5e2] sm:w-56" />

          <div className="mt-2 h-3 w-56 animate-pulse rounded bg-[#e8e5e2] sm:w-72" />
        </div>

        <div className="h-[57px] animate-pulse rounded-[16px] bg-[#eeeae7]" />

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_339px]">
          <div className="space-y-4">
            <div className="h-[285px] animate-pulse rounded-[16px] bg-[#eeeae7]" />
            <div className="h-[370px] animate-pulse rounded-[16px] bg-[#eeeae7]" />
          </div>

          <div className="space-y-4">
            <div className="h-[175px] animate-pulse rounded-[16px] bg-[#eeeae7]" />
            <div className="h-[160px] animate-pulse rounded-[16px] bg-[#eeeae7]" />
            <div className="h-[210px] animate-pulse rounded-[16px] bg-[#eeeae7]" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [state, setState] = useState<FetchState | null>(null);
  const loading = !orderId || state === null || state.orderId !== orderId;
  const order = state && state.orderId === orderId ? state.order : null;
  const error = state && state.orderId === orderId ? state.error : null;

  useEffect(() => {
    if (!orderId) return;

    const controller = new AbortController();

    async function fetchOrder() {
      try {
        const response = await fetchWithAuth(`/api/admin/orders/${orderId}`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to fetch order');
        }

        setState({ orderId, order: data, error: null });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        console.error('Error fetching order:', err);

        setState({
          orderId,
          order: null,
          error: err instanceof Error ? err.message : 'Failed to fetch order',
        });
      }
    }

    fetchOrder();

    return () => controller.abort();
  }, [orderId]);

  const customerInitials = useMemo(() => {
    if (!order?.customerName) return '?';

    return getInitials(order.customerName);
  }, [order?.customerName]);

  if (loading) {
    return <LoadingPage />;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] px-4 py-8">
        <div className="mx-auto max-w-[600px] rounded-[16px] border border-[#e8e5e2] bg-white p-6 text-center shadow-sm">
          <h1 className="text-[16px] font-semibold text-[#292725]">Unable to load order</h1>

          <p className="mt-2 text-[11px] text-[#8b8580]">{error || 'Order not found'}</p>

          <button type="button" onClick={() => router.back()} className="mt-4 rounded-[9px] bg-[#292725] px-4 py-2 text-[10px] font-semibold text-white">
            Back to orders
          </button>
        </div>
      </div>
    );
  }

  const statusStyles = getStatusStyles(order.status);

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#292725]">
      <main className="px-3 pt-6 pb-8 sm:px-4">
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-1 text-[9px] text-[#77716d]">
            <ArrowLeft size={11} />

            <button type="button" onClick={() => router.push('/admin/orders')}>
              Back to orders
            </button>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[18px] font-bold tracking-[-0.4px] sm:text-[20px]">{order.orderNumber}</h1>

                <span className={`flex items-center gap-1 rounded-full px-2 py-[3px] text-[9px] font-semibold ${statusStyles.wrapper}`}>
                  <span className={`h-[5px] w-[5px] rounded-full ${statusStyles.dot}`} />

                  {formatStatus(order.status)}
                </span>

                <PaymentBadge status={order.paymentStatus} />
              </div>

              <p className="mt-1 text-[10px] text-[#88827d]">
                Placed {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <button type="button" className="flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] border border-[#ddd9d6] bg-white px-3 text-[10px] font-medium whitespace-nowrap text-[#3d3936] transition-colors hover:bg-[#f8f7f6] sm:h-[31px]">
                <Printer size={13} />
                <span>Print Invoice</span>
              </button>

              <button type="button" className="flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] border border-[#ddd9d6] bg-white px-3 text-[10px] font-medium whitespace-nowrap text-[#3d3936] transition-colors hover:bg-[#f8f7f6] sm:h-[31px]">
                <FileText size={13} />
                <span>Packing Slip</span>
              </button>

              <button type="button" className="flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] border border-[#ddd9d6] bg-white px-3 text-[10px] font-medium whitespace-nowrap text-[#3d3936] transition-colors hover:bg-[#f8f7f6] sm:h-[31px]">
                <RefreshCcw size={13} />
                <span>Refund</span>
              </button>

              <button type="button" className="flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] bg-[#292725] px-3 text-[10px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#1f1d1b] sm:h-[31px]">
                <Truck size={13} />
                <span>Assign Rider</span>
              </button>
            </div>
          </div>
        </div>
        {order.status.toUpperCase() === 'PENDING' && (
          <div className="mb-5 flex min-h-[57px] flex-col items-start justify-between gap-3 rounded-[16px] border border-[#f3d47b] bg-[#fffdf4] px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:py-0">
            <div>
              <div className="text-[11px] font-semibold text-[#373330]">This order is waiting for your decision</div>

              <div className="mt-[2px] text-[9px] text-[#837c76]">Accepting sends it straight to the cutting station queue.</div>
            </div>

            <div className="flex w-full items-center gap-1.5 sm:w-auto">
              <button type="button" className="flex h-[32px] flex-1 items-center justify-center gap-1.5 rounded-[9px] border border-[#ddd9d6] bg-white px-3 text-[10px] font-medium whitespace-nowrap text-[#393532] sm:flex-none">
                <X size={13} />
                Reject Order
              </button>

              <button type="button" className="flex h-[32px] flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-[#ed5a29] px-3.5 text-[10px] font-semibold whitespace-nowrap text-white sm:flex-none">
                <Check size={13} />
                Accept Order
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_339px]">
          <div className="space-y-4">
            <section className="overflow-hidden rounded-[16px] border border-[#e8e5e2] bg-white shadow-[0_5px_16px_rgba(0,0,0,0.055)]">
              <div className="px-4 pt-4 pb-3">
                <h2 className="text-[11px] font-semibold">Items</h2>

                <p className="mt-[2px] text-[9px] text-[#99918b]">
                  {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse">
                  <thead>
                    <tr className="h-[30px] border-y border-[#ebe8e5] bg-[#fcfbfa]">
                      <th className="pl-4 text-left text-[8px] font-semibold tracking-[0.3px] text-[#89827c] uppercase">Product</th>

                      <th className="text-left text-[8px] font-semibold tracking-[0.3px] text-[#89827c] uppercase">Tier</th>

                      <th className="text-left text-[8px] font-semibold tracking-[0.3px] text-[#89827c] uppercase">Qty</th>

                      <th className="text-left text-[8px] font-semibold tracking-[0.3px] text-[#89827c] uppercase">Unit Price</th>

                      <th className="pr-4 text-right text-[8px] font-semibold tracking-[0.3px] text-[#89827c] uppercase">Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="h-[50px] border-b border-[#efedeb]">
                        <td className="pl-4">
                          <div className="flex items-center gap-2">
                            {item.image ? <img src={item.image} alt={item.productName} className="h-[30px] w-[30px] shrink-0 rounded-[6px] object-cover" /> : null}

                            <div className="text-[10px] font-medium whitespace-nowrap text-[#383431]">{item.productName}</div>
                          </div>
                        </td>

                        <td className="text-[10px] whitespace-nowrap text-[#4e4945]">{item.tier || '—'}</td>

                        <td className="text-[10px] whitespace-nowrap text-[#4e4945]">{item.quantity}</td>

                        <td className="text-[10px] whitespace-nowrap text-[#4e4945]">{formatCurrency(item.pricePerUnit)}</td>

                        <td className="pr-4 text-right text-[10px] font-bold whitespace-nowrap">{formatCurrency(item.pricePerUnit * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="px-4 pt-2 pb-3">
                <div className="flex h-[21px] items-center justify-between">
                  <span className="text-[10px] text-[#847d77]">Subtotal</span>

                  <span className="text-[10px] text-[#55504c]">{formatCurrency(order.subtotal)}</span>
                </div>

                <div className="flex h-[21px] items-center justify-between">
                  <span className="text-[10px] text-[#847d77]">Delivery</span>

                  <span className="text-[10px] text-[#55504c]">{formatCurrency(order.shipping)}</span>
                </div>

                <div className="flex h-[21px] items-center justify-between">
                  <span className="text-[10px] text-[#847d77]">Tax</span>

                  <span className="text-[10px] text-[#55504c]">{formatCurrency(order.tax)}</span>
                </div>

                <div className="mt-1 flex items-center justify-between border-t border-[#e9e6e3] pt-2">
                  <span className="text-[11px] font-semibold">Total</span>

                  <span className="text-[14px] font-bold">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-[16px] border border-[#e8e5e2] bg-white px-4 py-4 shadow-[0_5px_16px_rgba(0,0,0,0.055)]">
              <div className="mb-3">
                <h2 className="text-[11px] font-semibold">Order Information</h2>

                <p className="mt-[2px] text-[9px] text-[#99918b]">Delivery and tracking information for this order</p>
              </div>

              <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                <InfoRow label="Order ID" value={order.id} />

                <InfoRow label="Location" value={order.location} />

                <InfoRow label="Tracking number" value={order.trackingNumber || 'Not assigned'} />

                <InfoRow label="Estimated delivery" value={order.estimatedDelivery ? formatDate(order.estimatedDelivery) : 'Not available'} />

                <InfoRow label="Shipping city" value={order.customerAddress.city} />

                <InfoRow label="Shipping state" value={order.customerAddress.state} />

                <InfoRow label="Country" value={order.customerAddress.country} />

                <InfoRow label="ZIP" value={order.customerAddress.zip} />
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-[16px] border border-[#e8e5e2] bg-white px-4 py-4 shadow-[0_5px_16px_rgba(0,0,0,0.055)]">
              <h2 className="text-[11px] font-semibold">Customer</h2>

              <div className="mt-3 flex items-center gap-2.5">
                <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[#fce0d6] text-[10px] font-bold text-[#e75b2e]">{customerInitials}</div>

                <div className="min-w-0">
                  <div className="truncate text-[10px] font-semibold">{order.customer.name}</div>

                  <div className="truncate text-[9px] text-[#99918b]">Customer ID {order.customer.id}</div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-[#5d5752]">
                  <Mail size={13} className="shrink-0 text-[#99918b]" />

                  <span className="truncate">{order.customer.email}</span>
                </div>

                <div className="flex items-start gap-2 text-[10px] leading-[15px] text-[#5d5752]">
                  <MapPin size={13} className="mt-[1px] shrink-0 text-[#99918b]" />

                  <span>
                    {order.customerAddress.address}, {order.customerAddress.city}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-[16px] border border-[#e8e5e2] bg-white px-4 py-4 shadow-[0_5px_16px_rgba(0,0,0,0.055)]">
              <h2 className="text-[11px] font-semibold">Delivery</h2>

              <div className="mt-3 space-y-3">
                <InfoRow label="Zone" value={order.delivery.zone || order.location} />

                <InfoRow label="Assigned rider" value={order.rider?.name || 'Unassigned'} />

                <InfoRow label="Rider status" value={order.rider?.status || 'Unassigned'} />

                <div>
                  <span className="text-[10px] text-[#928b85]">Address</span>

                  <p className="mt-1 text-[10px] leading-[15px] text-[#403b37]">
                    {order.customerAddress.address}, {order.customerAddress.city}, {order.customerAddress.state}
                    {order.customerAddress.zip ? `, ${order.customerAddress.zip}` : ''}
                  </p>
                </div>
              </div>
            </section>

            {order.rider && (
              <section className="rounded-[16px] border border-[#e8e5e2] bg-white px-4 py-4 shadow-[0_5px_16px_rgba(0,0,0,0.055)]">
                <h2 className="text-[11px] font-semibold">Rider</h2>

                <div className="mt-3 flex items-center gap-2.5">
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[#eeeae7] text-[10px] font-bold text-[#5b5550]">{getInitials(order.rider.name)}</div>

                  <div>
                    <div className="text-[10px] font-semibold">{order.rider.name}</div>

                    <div className="text-[9px] text-[#99918b]">{order.rider.status}</div>
                  </div>
                </div>

                {order.rider.phone && (
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-[#5d5752]">
                    <Phone size={13} className="text-[#99918b]" />

                    {order.rider.phone}
                  </div>
                )}
              </section>
            )}

            <section className="rounded-[16px] border border-[#e8e5e2] bg-white px-4 py-4 shadow-[0_5px_16px_rgba(0,0,0,0.055)]">
              <h2 className="text-[11px] font-semibold">Shipping Address</h2>

              <div className="mt-3 flex gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#89837e]" />

                <div className="text-[10px] leading-[16px] text-[#514b47]">
                  <div>{order.customerAddress.address}</div>

                  <div>
                    {order.customerAddress.city}, {order.customerAddress.state}
                  </div>

                  {order.customerAddress.zip && <div>{order.customerAddress.zip}</div>}

                  <div>{order.customerAddress.country}</div>
                </div>
              </div>
            </section>

            <section className="rounded-[16px] border border-[#e8e5e2] bg-white px-3 py-4 shadow-[0_5px_16px_rgba(0,0,0,0.055)]">
              <h2 className="px-1 text-[11px] font-semibold">Documents</h2>

              <div className="mt-3 space-y-1.5">
                <DocumentRow icon={<FileText size={13} />} label={`Invoice ${order.orderNumber}`} />

                <DocumentRow icon={<FileText size={13} />} label="Packing slip" />
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
