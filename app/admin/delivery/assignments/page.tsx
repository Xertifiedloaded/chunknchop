'use client';

import { useState } from 'react';

type Rider = {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  phone: string;
  vehicleType: string;
  vehicleColor: string;
  plateNumber: string;
  activeDeliveries: number;
};
export default function DeliveryAssignmentsPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [mode, setMode] = useState<'automatic' | 'manual'>('manual');
  const [riders, setRiders] = useState<Rider[]>([]);
  const [riderId, setRiderId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function findRiders() {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/delivery/assignments?orderNumber=${encodeURIComponent(orderNumber.trim())}`,
        { cache: 'no-store' },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Unable to find eligible riders');
      setRiders(data.riders ?? []);
      setRiderId(data.riders?.[0]?.id ?? '');
      if (!data.riders?.length)
        setError('No approved, active, available rider with capacity serves this order zone.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to find riders');
    } finally {
      setLoading(false);
    }
  }

  async function assign() {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await fetch('/api/admin/delivery/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          mode,
          ...(mode === 'manual' ? { riderUserId: riderId } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Assignment failed');
      setSuccess(`${data.rider.name} has been assigned to ${data.orderNumber}.`);
      setRiders([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assignment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 text-[#24231f]">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9b4c2e]">
        Delivery operations
      </p>
      <h1 className="mt-2 text-3xl font-black">Rider assignment</h1>
      <p className="mt-2 text-sm text-stone-600">
        Assign only paid orders to existing rider-role accounts with an approved, active profile,
        availability and matching service zone.
      </p>
      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>
      )}
      <section className="mt-7 space-y-5 rounded-2xl border border-stone-200 bg-white p-5">
        <label className="grid gap-1.5 text-sm font-semibold">
          Paid order number
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="CNC-…"
            className="rounded-lg border border-stone-300 px-3 py-3 font-normal"
          />
        </label>
        <button
          disabled={loading || !orderNumber.trim()}
          onClick={() => void findRiders()}
          className="rounded-lg border border-stone-300 px-4 py-3 text-sm font-bold disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Find eligible riders'}
        </button>
        <div>
          <h2 className="font-bold">Assignment method</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode('automatic')}
              className={`rounded-xl border p-4 text-left ${mode === 'automatic' ? 'border-[#9b4c2e] bg-[#fbf3ef]' : 'border-stone-200'}`}
            >
              <b>Automatic</b>
              <span className="mt-1 block text-xs text-stone-500">
                Select the eligible rider with the lowest current workload.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`rounded-xl border p-4 text-left ${mode === 'manual' ? 'border-[#9b4c2e] bg-[#fbf3ef]' : 'border-stone-200'}`}
            >
              <b>Manual</b>
              <span className="mt-1 block text-xs text-stone-500">
                Choose a rider from the eligible list below.
              </span>
            </button>
          </div>
        </div>
        {mode === 'manual' && (
          <div>
            <h2 className="font-bold">Eligible riders</h2>
            {riders.length ? (
              <div className="mt-3 grid gap-2">
                {riders.map((r) => (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${riderId === r.id ? 'border-[#9b4c2e] bg-[#fbf3ef]' : 'border-stone-200'}`}
                  >
                    <input
                      type="radio"
                      name="rider"
                      checked={riderId === r.id}
                      onChange={() => setRiderId(r.id)}
                      className="mt-1"
                    />
                    <span className="min-w-0 flex-1">
                      <b>{r.name}</b>
                      <span className="block text-xs text-stone-500">
                        {r.phone} · {r.vehicleType} · {r.vehicleColor} · {r.plateNumber}
                      </span>
                      <span className="block text-xs text-stone-500">
                        {r.activeDeliveries} active deliveries
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-stone-500">
                Enter a paid order number and find riders to load the eligible list.
              </p>
            )}
          </div>
        )}
        <button
          onClick={() => void assign()}
          disabled={loading || !orderNumber.trim() || (mode === 'manual' && !riderId)}
          className="w-full rounded-lg bg-[#9b4c2e] px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          {loading
            ? 'Processing…'
            : mode === 'automatic'
              ? 'Assign automatically'
              : 'Confirm manual assignment'}
        </button>
      </section>
      <p className="mt-4 text-xs text-stone-500">
        Customers are never promoted to rider. Eligibility is checked again by the server at the
        moment of assignment.
      </p>
    </main>
  );
}
