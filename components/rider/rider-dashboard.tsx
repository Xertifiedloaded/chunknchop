'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import RiderFinancePanel from '@/components/rider/rider-finance-panel';
import OrderConversation from '@/components/orders/order-conversation';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
} from 'lucide-react';

type RiderOrder = {
  orderNumber: string;
  status?: string;
  paymentStatus?: string;
  customerName?: string;
  delivery?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    area?: string;
    city?: string;
    region?: string;
    deliveryDate?: string;
    deliveryWindow?: string;
    deliveryNotes?: string;
  };
  items?: Array<{ name?: string; quantity?: number }>;
  riderLocation?: { latitude?: number; longitude?: number };
};
type Profile = { isAvailable: boolean; isActive: boolean; verificationStatus: string };

const card = 'rounded-xl border border-[#eae5dc] bg-white shadow-[0_3px_15px_rgba(40,30,20,0.025)]';
const primaryBtn =
  'inline-flex items-center justify-center rounded-lg bg-[#29231e] px-3.5 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#493b2d] disabled:opacity-50';
const outlineBtn =
  'inline-flex items-center justify-center rounded-lg border border-[#e9e4dc] bg-white px-3.5 py-2.5 text-[11px] font-semibold text-[#51483e] transition hover:border-[#c9aa86] hover:bg-[#faf7f2]';

const statusStyle: Record<string, string> = {
  assigned: 'bg-amber-50 text-amber-700',
  picked_up: 'bg-[#f6f0e8] text-[#8c6238]',
  out_for_delivery: 'bg-blue-50 text-blue-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function RiderDashboard({ name }: { name: string }) {
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const [ordersResponse, profileResponse] = await Promise.all([
      fetch('/api/rider/orders', { cache: 'no-store' }),
      fetch('/api/rider/profile', { cache: 'no-store' }),
    ]);
    const [ordersData, profileData] = await Promise.all([
      ordersResponse.json().catch(() => ({})),
      profileResponse.json().catch(() => ({})),
    ]);
    if (!ordersResponse.ok) throw new Error(ordersData.error ?? 'Unable to load deliveries');
    if (!profileResponse.ok)
      throw new Error(profileData.error ?? 'Complete your rider profile first');
    setOrders(ordersData.orders ?? []);
    setProfile(profileData.profile);
  }, []);

  useEffect(() => {
    void load().catch((e) => setError(e.message));
    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 20000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function toggleAvailability() {
    if (!profile) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/rider/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !profile.isAvailable }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? 'Unable to update availability');
        return;
      }
      setProfile((p) => (p ? { ...p, isAvailable: data.isAvailable } : p));
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(orderNumber: string, status: string) {
    setMessage('');
    setError('');
    try {
      const response = await fetch(`/api/rider/orders/${encodeURIComponent(orderNumber)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? 'Unable to update delivery');
        return;
      }
      setMessage(`Order ${orderNumber} updated.`);
      await load();
    } catch {
      setError('Network error. Please try again.');
    }
  }

  useEffect(() => {
    if (!profile?.isAvailable || !navigator.geolocation) return;
    const active = orders.filter((o) =>
      ['assigned', 'picked_up', 'out_for_delivery'].includes(o.status ?? ''),
    );
    if (!active.length) return;
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        active.forEach((order) => {
          void fetch(`/api/rider/orders/${encodeURIComponent(order.orderNumber)}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(location),
          }).catch(() => undefined);
        });
      },
      () => setError('Location permission is needed to share your live delivery position.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [profile?.isAvailable, orders]);

  const canToggle = !!profile && profile.verificationStatus === 'approved' && profile.isActive;

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 text-[#29241f] sm:px-6 sm:py-10">
      <Link
        href="/account"
        className="mb-6 inline-flex items-center gap-2 text-[11px] font-semibold text-[#82796e] transition hover:text-[#986735]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to account
      </Link>

      <header className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a17443]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#a17443]" />
          Rider workspace
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#28231e] sm:text-[28px]">
          Welcome, {name}
        </h1>
        <p className="mt-1.5 text-[12px] text-[#89837b]">
          Manage assigned deliveries and share your location while the dashboard is open.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50/70 p-4 text-[11px] text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-[11px] text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </p>
      )}

      {}
      <section className={`${card} overflow-hidden`}>
        <div className="h-1 bg-gradient-to-r from-[#80532c] via-[#b68a5b] to-[#e2c7a5]" />
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#999187]">
              Your availability
            </p>
            <p className="mt-2 flex items-center gap-2 text-[15px] font-bold text-[#29241f]">
              <span
                className={`h-2 w-2 rounded-full ${profile?.isAvailable ? 'bg-emerald-500' : 'bg-[#b8afa4]'}`}
              />
              {profile?.isAvailable ? 'Available for deliveries' : 'Currently offline'}
            </p>
            <p className="mt-1 text-[10px] text-[#928b82]">
              Approval:{' '}
              <span className="capitalize">{profile?.verificationStatus ?? 'Loading'}</span> ·
              Account active: {profile?.isActive ? 'Yes' : 'No'}
            </p>
          </div>
          <button
            onClick={() => void toggleAvailability()}
            disabled={busy || !canToggle}
            className={profile?.isAvailable ? `${outlineBtn} disabled:opacity-50` : `${primaryBtn}`}
          >
            {busy ? 'Updating…' : profile?.isAvailable ? 'Go offline' : 'Go available'}
          </button>
        </div>
      </section>

      <RiderFinancePanel />

      {}
      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-[15px] font-bold text-[#302a24]">My deliveries</h2>
            <p className="mt-1 text-[11px] text-[#928b82]">Orders assigned to you.</p>
          </div>
          <span className="text-[10px] font-medium text-[#a59c91]">{orders.length} ORDERS</span>
        </div>

        {orders.length ? (
          <div className="grid gap-3">
            {orders.map((order) => {
              const status = order.status ?? 'pending';
              const address = [
                order.delivery?.addressLine1,
                order.delivery?.addressLine2,
                order.delivery?.area,
                order.delivery?.city,
                order.delivery?.region,
              ]
                .filter(Boolean)
                .join(', ');
              return (
                <article key={order.orderNumber} className={`${card} p-4 sm:p-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all text-[10px] text-[#928b82]">{order.orderNumber}</p>
                      <span
                        className={`mt-1.5 inline-flex rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${
                          statusStyle[status] ?? 'bg-[#f6f0e8] text-[#8c6238]'
                        }`}
                      >
                        {status.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <span className="rounded-md bg-[#f6f0e8] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#8c6238]">
                      Payment: {order.paymentStatus ?? 'paid'}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[#eeeae3] p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#999187]">
                        Customer
                      </p>
                      <p className="mt-2 text-[12px] font-semibold text-[#393129]">
                        {order.delivery?.fullName ?? order.customerName ?? 'Customer'}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#71685e]">
                        <Phone className="h-3 w-3" />
                        {order.delivery?.phone ?? '—'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#eeeae3] p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#999187]">
                        Address
                      </p>
                      <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-[1.7] text-[#393129]">
                        <MapPin className="mt-1 h-3 w-3 shrink-0 text-[#986735]" />
                        {address || 'Pickup / address unavailable'}
                      </p>
                    </div>
                  </div>

                  {(order.delivery?.deliveryDate || order.delivery?.deliveryNotes) && (
                    <div className="mt-3 space-y-1.5 text-[11px] text-[#71685e]">
                      {order.delivery?.deliveryDate && (
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span className="font-semibold">Scheduled:</span>{' '}
                          {new Date(order.delivery.deliveryDate).toLocaleString()}{' '}
                          {order.delivery.deliveryWindow ?? ''}
                        </p>
                      )}
                      {order.delivery?.deliveryNotes && (
                        <p>
                          <span className="font-semibold">Instructions:</span>{' '}
                          {order.delivery.deliveryNotes}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.status === 'assigned' && (
                      <button
                        onClick={() => void updateStatus(order.orderNumber, 'picked_up')}
                        className={primaryBtn}
                      >
                        Mark picked up
                      </button>
                    )}
                    {order.status === 'picked_up' && (
                      <button
                        onClick={() => void updateStatus(order.orderNumber, 'out_for_delivery')}
                        className={primaryBtn}
                      >
                        Out for delivery
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => void updateStatus(order.orderNumber, 'delivered')}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-3.5 py-2.5 text-[11px] font-semibold text-white transition hover:bg-emerald-800"
                      >
                        Mark delivered
                      </button>
                    )}
                    <Link
                      href={`/account/orders/${encodeURIComponent(order.orderNumber)}/track`}
                      className={outlineBtn}
                    >
                      Open tracking
                    </Link>
                  </div>

                  <div className="mt-4 border-t border-[#eeeae3] pt-4">
                    <OrderConversation orderNumber={order.orderNumber} viewer="rider" />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#e4ddd2] bg-white px-5 py-10 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f5eee4] text-[#a17a50]">
              <RefreshCw className="h-5 w-5" />
            </div>
            <p className="mt-3 text-[12px] font-bold text-[#393129]">No deliveries yet</p>
            <p className="mt-1.5 text-[10px] text-[#918980]">
              No deliveries have been assigned to you yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
