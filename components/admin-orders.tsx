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
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Could not assign this rider.');
      setMessage(
        `${orderNumber} assigned to ${result.rider.name || result.rider.email}. Rider access is enabled for this account.`,
      );
      await mutate();
    } catch (assignError) {
      setMessage(
        assignError instanceof Error ? assignError.message : 'Could not assign this rider.',
      );
    } finally {
      setBusyOrder(null);
    }
  }

  return (
    <section className="admin-card admin-orders-card" aria-labelledby="admin-orders-title">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">
            <span /> ORDER OPERATIONS
          </p>
          <h2 id="admin-orders-title">
            Orders <span className="admin-count">{orders.length}</span>
          </h2>
        </div>
        <Truck size={22} />
      </div>
      <p className="admin-orders-intro">
        Assign a paid order to a registered account by email. Assigning also grants rider access to
        that account.
      </p>
      {message && (
        <p className="admin-message" role="status" aria-live="polite">
          {message}
        </p>
      )}
      {isLoading ? (
        <p className="admin-feedback">Loading orders…</p>
      ) : error ? (
        <p className="admin-feedback" role="alert">
          {error.message}
        </p>
      ) : orders.length === 0 ? (
        <div className="admin-empty">
          <PackageCheck size={22} />
          <p>No customer orders yet.</p>
          <span>Paid orders will appear here when customers check out.</span>
        </div>
      ) : (
        <div className="admin-order-list">
          {orders.map((order) => (
            <article className="admin-order-row" key={order.orderNumber}>
              <div className="admin-order-summary">
                <div>
                  <span>
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    · {order.delivery?.city ?? 'Delivery'}
                    {order.delivery?.region ? `, ${order.delivery.region}` : ''}
                  </span>
                  <h3>{order.orderNumber}</h3>
                  <p>{order.email}</p>
                </div>
                <div>
                  <strong>{formatPrice(order.subtotalCents)}</strong>
                  <span className={`order-status-pill order-status-${order.status}`}>
                    {order.status.replaceAll('_', ' ')}
                  </span>
                </div>
              </div>
              {order.riderEmail ? (
                <p className="admin-assigned-rider">
                  <Truck size={14} /> {order.riderName || order.riderEmail} · {order.riderEmail}
                </p>
              ) : (
                <form
                  className="admin-assign-form"
                  onSubmit={(event) => void assignRider(event, order.orderNumber)}
                >
                  <label htmlFor={`rider-${order.orderNumber}`}>
                    Rider account email
                    <input
                      id={`rider-${order.orderNumber}`}
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
                    className="admin-secondary-button"
                    type="submit"
                    disabled={busyOrder === order.orderNumber || order.paymentStatus !== 'paid'}
                  >
                    {busyOrder === order.orderNumber ? (
                      <LoaderCircle className="auth-spinner" size={15} />
                    ) : (
                      <ArrowUpRight size={15} />
                    )}{' '}
                    ASSIGN RIDER
                  </button>
                  {order.paymentStatus !== 'paid' && (
                    <span className="admin-assign-hint">
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
