'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
type Zone = {
  id: string;
  name: string;
  city: string;
  state: string;
  deliveryFeeCents: number;
  active: boolean;
};
const naira = (cents: number) =>
  `₦${(cents / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [form, setForm] = useState({
    name: '',
    city: 'Abeokuta',
    state: 'Ogun',
    deliveryFeeNaira: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const r = await fetch('/api/admin/delivery/zones', { cache: 'no-store' });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error ?? 'Unable to load zones');
    setZones(d.zones ?? []);
  }, []);
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);
  async function add(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (
      !form.deliveryFeeNaira.trim() ||
      !Number.isFinite(Number(form.deliveryFeeNaira)) ||
      Number(form.deliveryFeeNaira) < 0
    ) {
      setError('Enter the delivery fee approved for this zone.');
      return;
    }
    setBusy(true);
    const r = await fetch('/api/admin/delivery/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        city: form.city,
        state: form.state,
        deliveryFeeCents: Math.round(Number(form.deliveryFeeNaira) * 100),
        active: true,
      }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(d.error ?? 'Unable to create zone');
      return;
    }
    setForm((v) => ({ ...v, name: '', deliveryFeeNaira: '' }));
    setSuccess('Delivery zone and price created.');
    await load();
  }
  async function toggle(zone: Zone) {
    const r = await fetch(`/api/admin/delivery/zones/${zone.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: zone.name,
        city: zone.city,
        state: zone.state,
        deliveryFeeCents: zone.deliveryFeeCents,
        active: !zone.active,
      }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? 'Unable to update zone');
      return;
    }
    await load();
  }
  async function editFee(zone: Zone) {
    const value = window.prompt(
      `New delivery fee for ${zone.name} (naira):`,
      String(zone.deliveryFeeCents / 100),
    );
    if (value === null) return;
    if (!value.trim() || !Number.isFinite(Number(value)) || Number(value) < 0) {
      setError('Enter a valid non-negative delivery fee.');
      return;
    }
    const r = await fetch(`/api/admin/delivery/zones/${zone.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: zone.name,
        city: zone.city,
        state: zone.state,
        deliveryFeeCents: Math.round(Number(value) * 100),
        active: zone.active,
      }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? 'Unable to update zone price');
      return;
    }
    setSuccess(`${zone.name} delivery fee updated.`);
    await load();
  }
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 text-[#24231f]">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9b4c2e]">
        Delivery operations
      </p>
      <h1 className="mt-2 text-3xl font-black">Delivery zones & pricing</h1>
      <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold underline">
        <Link href="/admin/delivery/schedule">Manage delivery schedules</Link>
        <Link href="/admin/delivery/settings">Delivery settings</Link>
        <Link href="/admin/delivery/assignments">Rider assignments</Link>
        <Link href="/admin/riders">Manage riders</Link>
      </div>
      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>
      )}
      <form
        onSubmit={add}
        className="mt-7 grid gap-3 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="grid gap-1 text-sm font-semibold">
          Zone / area
          <input
            required
            placeholder="e.g. Kuto"
            value={form.name}
            onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
            className="rounded-lg border px-3 py-3 font-normal"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          City
          <input
            required
            value={form.city}
            onChange={(e) => setForm((v) => ({ ...v, city: e.target.value }))}
            className="rounded-lg border px-3 py-3 font-normal"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          State
          <input
            required
            value={form.state}
            onChange={(e) => setForm((v) => ({ ...v, state: e.target.value }))}
            className="rounded-lg border px-3 py-3 font-normal"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Delivery fee (₦)
          <input
            required
            type="number"
            min="0"
            step="0.01"
            placeholder="Set by admin"
            value={form.deliveryFeeNaira}
            onChange={(e) => setForm((v) => ({ ...v, deliveryFeeNaira: e.target.value }))}
            className="rounded-lg border px-3 py-3 font-normal"
          />
        </label>
        <button
          disabled={busy}
          className="rounded-lg bg-[#9b4c2e] px-4 py-3 font-bold text-white disabled:opacity-50 sm:col-span-2 lg:col-span-4"
        >
          {busy ? 'Saving…' : 'Create delivery zone'}
        </button>
      </form>
      <section className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="border-b bg-stone-50 px-5 py-4">
          <h2 className="font-bold">Configured delivery areas</h2>
          <p className="mt-1 text-xs text-stone-500">
            Only active zones can be selected at checkout.
          </p>
        </div>
        {zones.length ? (
          zones.map((z) => (
            <div
              key={z.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-5 py-4"
            >
              <div>
                <b>{z.name}</b>
                <p className="mt-1 text-sm text-stone-500">
                  {z.city}, {z.state} · {naira(z.deliveryFeeCents)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => void editFee(z)}
                  className="rounded-lg border px-3 py-2 text-xs font-semibold"
                >
                  Edit price
                </button>
                <button
                  onClick={() => void toggle(z)}
                  className="rounded-lg border px-3 py-2 text-xs font-semibold"
                >
                  {z.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="p-8 text-center text-sm text-stone-500">No delivery zones created yet.</p>
        )}
      </section>
    </main>
  );
}
