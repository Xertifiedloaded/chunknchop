
'use client';

import { useState, type FormEvent } from 'react';
import useSWR from 'swr';
import { ArrowUpRight, LoaderCircle, PackageCheck, Truck } from 'lucide-react';
import { formatPrice } from '@/lib/catalog';

type AdminOrder = {
  orderNumber: string;
  email: string;
  status: string;
  paymentStatus: string;
  subtotalCents: number;
  createdAt: string;
  riderName?: string;
  riderEmail?: string;
  delivery?: { city?: string; region?: string };
};

type AdminOrdersResponse = { orders: AdminOrder[] };

async function fetchAdminOrders(url: string): Promise<AdminOrdersResponse> {
  const response = await fetch(url, { cache: 'no-store' });
  const result = await response.json().catch(() => null);

  if (!response.ok) throw new Error(result?.error || 'Could not load orders.');

  return result;
}

export default function AdminOrders() {
  const { data, error, isLoading, mutate } = useSWR<AdminOrdersResponse>(
    '/api/admin/orders',
    fetchAdminOrders,
    { refreshInterval: 15_000 },
  );

  const [emails, setEmails] = useState<Record<string, string>>({});
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const orders = data?.orders ?? [];

  async function assignRider(event: FormEvent<HTMLFormElement>, orderNumber: string) {
    event.preventDefault();

    const email = emails[orderNumber]?.trim();
    if (!email) return;

    setBusyOrder(orderNumber);
    setMessage('');

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderNumber)}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Could not assign this rider.');
      }

      setMessage(
        `${orderNumber} assigned to ${result.rider.name || result.rider.email}. Rider access is enabled for this account.`,
      );

      await mutate();
    } catch (assignError) {
      setMessage(
        assignError instanceof Error
          ? assignError.message
          : 'Could not assign this rider.',
      );
    } finally {
      setBusyOrder(null);
    }
  }

  return (
    <section
      className="rounded-sm border border-[#e6e4de] bg-white p-5 shadow-[0_2px_12px_rgba(36,35,31,0.03)] sm:p-7"
      aria-labelledby="admin-orders-title"
    >
      {/* Section heading */}
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#e6e4de] pb-5">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#88847d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e86b3e]" />
            ORDER OPERATIONS
          </p>

          <h2
            id="admin-orders-title"
            className="flex items-center gap-3 font-heading text-2xl font-semibold tracking-tight text-[#24231f]"
          >
            Orders
            <span className="rounded-full bg-[#f0eee9] px-2.5 py-1 text-xs font-semibold text-[#77736d]">
              {orders.length}
            </span>
          </h2>
        </div>

        <Truck size={22} className="shrink-0 text-[#e86b3e]" />
      </div>

      <p className="mb-6 max-w-2xl text-sm leading-6 text-[#77736d]">
        Assign a paid order to a registered account by email. Assigning also grants
        rider access to that account.
      </p>

      {message && (
        <p
          className="mb-5 border border-[#e6e4de] bg-[#fcfcfa] px-4 py-3 text-xs leading-5 text-[#77736d]"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      )}

      {/* Loading state */}
      {isLoading ? (
        <p className="py-8 text-center text-sm text-[#88847d]">
          Loading orders…
        </p>
      ) : error ? (
        <p
          className="border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"
          role="alert"
        >
          {error.message}
        </p>
      ) : orders.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
          <PackageCheck size={28} className="mb-4 text-[#c5c0b6]" />

          <p className="text-sm font-semibold text-[#332925]">
            No customer orders yet.
          </p>

          <span className="mt-2 text-xs leading-5 text-[#88847d]">
            Paid orders will appear here when customers check out.
          </span>
        </div>
      ) : (
        /* Orders list */
        <div className="divide-y divide-[#e6e4de]">
          {orders.map((order) => (
            <article
              className="py-6 first:pt-0 last:pb-0"
              key={order.orderNumber}
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#88847d]">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    · {order.delivery?.city ?? 'Delivery'}
                    {order.delivery?.region ? `, ${order.delivery.region}` : ''}
                  </span>

                  <h3 className="mt-2 break-all font-heading text-base font-semibold text-[#24231f]">
                    {order.orderNumber}
                  </h3>

                  <p className="mt-1 break-all text-xs text-[#77736d]">
                    {order.email}
                  </p>
                </div>

                <div className="flex shrink-0 flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <strong className="font-heading text-lg font-semibold text-[#24231f]">
                    {formatPrice(order.subtotalCents)}
                  </strong>

                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
                      order.status === 'delivered'
                        ? 'bg-green-50 text-green-700'
                        : order.status === 'cancelled'
                          ? 'bg-red-50 text-red-700'
                          : order.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-[#f0eee9] text-[#77736d]'
                    }`}
                  >
                    {order.status.replaceAll('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Assigned rider */}
              {order.riderEmail ? (
                <p className="mt-5 flex flex-wrap items-center gap-2 border border-[#e6e4de] bg-[#fcfcfa] px-4 py-3 text-xs leading-5 text-[#77736d]">
                  <Truck size={14} className="shrink-0 text-[#e86b3e]" />
                  <span className="font-semibold text-[#332925]">
                    {order.riderName || order.riderEmail}
                  </span>
                  <span>·</span>
                  <span className="break-all">{order.riderEmail}</span>
                </p>
              ) : (
                /* Rider assignment form */
                <form
                  className="mt-5 flex flex-col gap-3 border-t border-[#f0eee9] pt-5 sm:flex-row sm:items-end"
                  onSubmit={(event) => void assignRider(event, order.orderNumber)}
                >
                  <label
                    className="flex min-w-0 flex-1 flex-col gap-2 text-xs font-semibold text-[#332925]"
                    htmlFor={`rider-${order.orderNumber}`}
                  >
                    Rider account email

                    <input
                      id={`rider-${order.orderNumber}`}
                      className="h-11 w-full border border-[#e6e4de] bg-[#fcfcfa] px-3 text-sm text-[#24231f] outline-none transition-colors placeholder:text-[#aaa69e] focus:border-[#e86b3e] disabled:cursor-not-allowed disabled:opacity-50"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      value={emails[order.orderNumber] ?? ''}
                      onChange={(event) =>
                        setEmails((current) => ({
                          ...current,
                          [order.orderNumber]: event.target.value,
                        }))
                      }
                      placeholder="rider@example.com"
                      required
                      disabled={order.paymentStatus !== 'paid'}
                    />
                  </label>

                  <button
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 border border-[#e6e4de] bg-white px-4 text-[10px] font-bold tracking-[0.1em] text-[#55514a] transition-colors hover:border-[#e86b3e] hover:text-[#e86b3e] disabled:cursor-not-allowed disabled:opacity-50"
                    type="submit"
                    disabled={
                      busyOrder === order.orderNumber ||
                      order.paymentStatus !== 'paid'
                    }
                  >
                    {busyOrder === order.orderNumber ? (
                      <LoaderCircle className="animate-spin" size={15} />
                    ) : (
                      <ArrowUpRight size={15} />
                    )}
                    ASSIGN RIDER
                  </button>

                  {order.paymentStatus !== 'paid' && (
                    <span className="text-[11px] leading-5 text-[#a9442c] sm:max-w-[160px]">
                      Payment is required before assignment.
                    </span>
                  )}
                </form>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
