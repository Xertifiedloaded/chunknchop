'use client';

import { useCallback, useEffect, useState } from 'react';

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
      ordersResponse.json(),
      profileResponse.json(),
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
    const response = await fetch('/api/rider/availability', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !profile.isAvailable }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? 'Unable to update availability');
      return;
    }
    setProfile((p) => (p ? { ...p, isAvailable: data.isAvailable } : p));
  }

  async function updateStatus(orderNumber: string, status: string) {
    setMessage('');
    const response = await fetch(`/api/rider/orders/${encodeURIComponent(orderNumber)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Unable to update delivery');
      return;
    }
    setMessage(`Order ${orderNumber} updated.`);
    await load();
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
          });
        });
      },
      () => setError('Location permission is needed to share your live delivery position.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [profile?.isAvailable, orders]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 text-[#24231f]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9b4c2e]">
            Rider workspace
          </p>
          <h1 className="mt-2 text-3xl font-black">Welcome, {name}</h1>
          <p className="mt-2 text-sm text-stone-500">
            Manage assigned deliveries and share your location while the dashboard is open.
          </p>
        </div>
        <a href="/rider/profile" className="rounded-lg border px-4 py-2 text-sm font-semibold">
          Rider profile
        </a>
      </div>
      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>
      )}
      <section className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5">
        <div>
          <p className="text-sm text-stone-500">Your availability</p>
          <p className="mt-1 text-xl font-bold">
            {profile?.isAvailable ? 'Available for deliveries' : 'Currently offline'}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Approval: {profile?.verificationStatus ?? 'Loading'} · Account active:{' '}
            {profile?.isActive ? 'Yes' : 'No'}
          </p>
        </div>
        <button
          onClick={() => void toggleAvailability()}
          disabled={
            busy || !profile || profile.verificationStatus !== 'approved' || !profile.isActive
          }
          className={`rounded-xl px-5 py-3 font-bold text-white disabled:opacity-40 ${profile?.isAvailable ? 'bg-stone-700' : 'bg-emerald-700'}`}
        >
          {busy ? 'Updating…' : profile?.isAvailable ? 'Go offline' : 'Go available'}
        </button>
      </section>
      <section className="mt-9">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">My deliveries</h2>
          <span className="text-sm text-stone-500">{orders.length} orders</span>
        </div>
        {orders.length ? (
          <div className="grid gap-4">
            {orders.map((order) => (
              <article
                key={order.orderNumber}
                className="rounded-2xl border border-stone-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-stone-500">{order.orderNumber}</p>
                    <h3 className="mt-1 font-bold capitalize">
                      {(order.status ?? 'pending').replaceAll('_', ' ')}
                    </h3>
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold">
                    Payment: {order.paymentStatus ?? 'paid'}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <p>
                    <b>Customer:</b> {order.delivery?.fullName ?? order.customerName ?? 'Customer'}
                  </p>
                  <p>
                    <b>Phone:</b> {order.delivery?.phone ?? '—'}
                  </p>
                  <p className="sm:col-span-2">
                    <b>Address:</b>{' '}
                    {[
                      order.delivery?.addressLine1,
                      order.delivery?.addressLine2,
                      order.delivery?.area,
                      order.delivery?.city,
                      order.delivery?.region,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Pickup / address unavailable'}
                  </p>
                  {order.delivery?.deliveryDate && (
                    <p className="sm:col-span-2">
                      <b>Scheduled:</b> {new Date(order.delivery.deliveryDate).toLocaleString()}{' '}
                      {order.delivery.deliveryWindow ?? ''}
                    </p>
                  )}
                  {order.delivery?.deliveryNotes && (
                    <p className="sm:col-span-2">
                      <b>Instructions:</b> {order.delivery.deliveryNotes}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {order.status === 'assigned' && (
                    <button
                      onClick={() => void updateStatus(order.orderNumber, 'picked_up')}
                      className="rounded-lg bg-[#9b4c2e] px-4 py-2 text-sm font-bold text-white"
                    >
                      Mark picked up
                    </button>
                  )}
                  {order.status === 'picked_up' && (
                    <button
                      onClick={() => void updateStatus(order.orderNumber, 'out_for_delivery')}
                      className="rounded-lg bg-[#9b4c2e] px-4 py-2 text-sm font-bold text-white"
                    >
                      Out for delivery
                    </button>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <button
                      onClick={() => void updateStatus(order.orderNumber, 'delivered')}
                      className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
                    >
                      Mark delivered
                    </button>
                  )}
                  <a
                    href={`/account/orders/${encodeURIComponent(order.orderNumber)}/track`}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold"
                  >
                    Open tracking
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-stone-500">
            No deliveries have been assigned to you yet.
          </div>
        )}
      </section>
    </div>
  );
}
