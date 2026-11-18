'use client';

import { useEffect, useState } from 'react';
export default function DeliverySettingsPage() {
  const [assignmentMode, setAssignmentMode] = useState<'automatic' | 'manual'>('automatic');
  const [manualFallback, setManualFallback] = useState(true);
  const [maxActiveDeliveries, setMaxActiveDeliveries] = useState('1');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch('/api/admin/delivery/settings', { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? 'Unable to load settings');
        setAssignmentMode(d.settings.assignmentMode);
        setManualFallback(d.settings.manualFallback);
        setMaxActiveDeliveries(String(d.settings.maxActiveDeliveries));
      })
      .catch((e) => setError(e.message));
  }, []);
  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    const r = await fetch('/api/admin/delivery/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignmentMode,
        manualFallback,
        maxActiveDeliveries: Number(maxActiveDeliveries),
      }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(d.error ?? 'Unable to save settings');
      return;
    }
    setMessage('Delivery settings saved.');
  }
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 text-[#24231f]">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9b4c2e]">
        Delivery operations
      </p>
      <h1 className="mt-2 text-3xl font-black">Delivery settings</h1>
      <p className="mt-2 text-sm text-stone-600">
        Choose how paid orders are assigned and set rider delivery capacity.
      </p>
      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>
      )}
      <section className="mt-7 space-y-6 rounded-2xl border border-stone-200 bg-white p-6">
        <div>
          <h2 className="font-bold">Default assignment mode</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label
              className={`cursor-pointer rounded-xl border p-4 ${assignmentMode === 'automatic' ? 'border-[#9b4c2e] bg-[#fbf3ef]' : 'border-stone-200'}`}
            >
              <input
                type="radio"
                checked={assignmentMode === 'automatic'}
                onChange={() => setAssignmentMode('automatic')}
              />{' '}
              <b className="ml-2">Automatic</b>
              <p className="mt-2 text-xs text-stone-500">
                After verified payment, assign to an eligible rider serving the order's zone.
              </p>
            </label>
            <label
              className={`cursor-pointer rounded-xl border p-4 ${assignmentMode === 'manual' ? 'border-[#9b4c2e] bg-[#fbf3ef]' : 'border-stone-200'}`}
            >
              <input
                type="radio"
                checked={assignmentMode === 'manual'}
                onChange={() => setAssignmentMode('manual')}
              />{' '}
              <b className="ml-2">Manual</b>
              <p className="mt-2 text-xs text-stone-500">
                Leave paid orders unassigned until an admin selects an eligible rider.
              </p>
            </label>
          </div>
        </div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={manualFallback}
            onChange={(e) => setManualFallback(e.target.checked)}
            className="mt-1"
          />
          <span>
            <b className="block text-sm">Allow manual fallback / override</b>
            <span className="mt-1 block text-xs text-stone-500">
              Admins can manually assign or override automatic assignment when operationally
              necessary. Rider eligibility checks still apply.
            </span>
          </span>
        </label>
        <label className="grid max-w-sm gap-1.5 text-sm font-semibold">
          Maximum active deliveries per rider
          <select
            value={maxActiveDeliveries}
            onChange={(e) => setMaxActiveDeliveries(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-3 font-normal"
          >
            <option value="1">1 delivery</option>
            <option value="2">2 deliveries</option>
            <option value="3">3 deliveries</option>
            <option value="5">5 deliveries</option>
          </select>
        </label>
        <button
          onClick={() => void save()}
          disabled={busy}
          className="rounded-lg bg-[#9b4c2e] px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save delivery settings'}
        </button>
      </section>
    </main>
  );
}
