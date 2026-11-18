'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';

type Zone = { id: string; name: string; city: string; state: string };
type Schedule = {
  id: string;
  zoneId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  bookedCount: number;
  active: boolean;
  zone: Zone;
};
const localInput = (date: Date) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};
const display = (date: string) =>
  new Date(date).toLocaleString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function DeliveryScheduleAdminPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [form, setForm] = useState({ zoneId: '', startsAt: '', endsAt: '', capacity: '10' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [z, s] = await Promise.all([
      fetch('/api/admin/delivery/zones', { cache: 'no-store' }),
      fetch('/api/admin/delivery/schedules', { cache: 'no-store' }),
    ]);
    const [zd, sd] = await Promise.all([z.json(), s.json()]);
    if (!z.ok) throw new Error(zd.error ?? 'Unable to load delivery zones');
    if (!s.ok) throw new Error(sd.error ?? 'Unable to load schedules');
    setZones(zd.zones ?? []);
    setSchedules(sd.schedules ?? []);
    if (!form.zoneId && zd.zones?.[0]) setForm((v) => ({ ...v, zoneId: zd.zones[0].id }));
  }, [form.zoneId]);

  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, [load]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    try {
      const response = await fetch('/api/admin/delivery/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: form.zoneId,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          capacity: Number(form.capacity),
          active: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Unable to create schedule');
      setSuccess(
        'Delivery schedule published. Customers in this zone can now select it at checkout.',
      );
      setForm((v) => ({ ...v, startsAt: '', endsAt: '' }));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create schedule');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(schedule: Schedule) {
    setError('');
    const response = await fetch(`/api/admin/delivery/schedules/${schedule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !schedule.active }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Unable to update schedule');
      return;
    }
    await load();
  }

  async function edit(schedule: Schedule) {
    const starts = window.prompt(
      'Start date/time (YYYY-MM-DDTHH:mm, local time)',
      localInput(new Date(schedule.startsAt)),
    );
    if (starts === null) return;
    const ends = window.prompt(
      'End date/time (YYYY-MM-DDTHH:mm, local time)',
      localInput(new Date(schedule.endsAt)),
    );
    if (ends === null) return;
    const capacityText = window.prompt('Maximum bookings for this slot', String(schedule.capacity));
    if (capacityText === null) return;
    const capacity = Number(capacityText);
    if (
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      capacity > 500 ||
      !Number.isFinite(new Date(starts).getTime()) ||
      !Number.isFinite(new Date(ends).getTime())
    ) {
      setError('Enter valid schedule dates, times and capacity.');
      return;
    }
    const response = await fetch(`/api/admin/delivery/schedules/${schedule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startsAt: new Date(starts).toISOString(),
        endsAt: new Date(ends).toISOString(),
        capacity,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Unable to edit schedule');
      return;
    }
    setSuccess('Delivery schedule updated.');
    await load();
  }

  async function remove(schedule: Schedule) {
    if (!window.confirm('Delete this schedule?')) return;
    const response = await fetch(`/api/admin/delivery/schedules/${schedule.id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Unable to delete schedule');
      return;
    }
    await load();
  }

  const minDate = localInput(new Date(Date.now() + 60 * 60 * 1000));
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 text-[#24231f]">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9b4c2e]">
        Delivery operations
      </p>
      <h1 className="mt-2 text-3xl font-black">Delivery dates & time slots</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        Only schedules published here appear to customers at checkout. Create different schedules
        for each delivery zone and control capacity.
      </p>
      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>
      )}
      <form
        onSubmit={create}
        className="mt-7 grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 md:grid-cols-2 lg:grid-cols-5"
      >
        <label className="grid gap-1.5 text-sm font-semibold lg:col-span-2">
          Delivery zone
          <select
            required
            value={form.zoneId}
            onChange={(e) => setForm((v) => ({ ...v, zoneId: e.target.value }))}
            className="rounded-lg border border-stone-300 bg-white px-3 py-3 font-normal"
          >
            <option value="">Select zone</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}, {z.city}, {z.state}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Starts at
          <input
            required
            type="datetime-local"
            min={minDate}
            value={form.startsAt}
            onChange={(e) => setForm((v) => ({ ...v, startsAt: e.target.value }))}
            className="min-w-0 rounded-lg border border-stone-300 px-3 py-3 font-normal"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Ends at
          <input
            required
            type="datetime-local"
            min={form.startsAt || minDate}
            value={form.endsAt}
            onChange={(e) => setForm((v) => ({ ...v, endsAt: e.target.value }))}
            className="min-w-0 rounded-lg border border-stone-300 px-3 py-3 font-normal"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Order capacity
          <input
            required
            type="number"
            min="1"
            max="500"
            value={form.capacity}
            onChange={(e) => setForm((v) => ({ ...v, capacity: e.target.value }))}
            className="rounded-lg border border-stone-300 px-3 py-3 font-normal"
          />
        </label>
        <button
          disabled={busy || !form.zoneId || !form.startsAt || !form.endsAt}
          className="rounded-lg bg-[#9b4c2e] px-5 py-3 font-bold text-white disabled:opacity-50 md:col-span-2 lg:col-span-5"
        >
          {busy ? 'Publishing…' : 'Publish delivery schedule'}
        </button>
      </form>
      <section className="mt-9">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Published schedules</h2>
          <span className="text-sm text-stone-500">{schedules.length} total</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="hidden grid-cols-[1.2fr_1.4fr_.7fr_.7fr_.8fr] gap-4 bg-stone-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-stone-500 md:grid">
            <span>Zone</span>
            <span>Date & time</span>
            <span>Bookings</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {schedules.length ? (
            schedules.map((s) => (
              <div
                key={s.id}
                className="grid gap-2 border-t border-stone-100 px-4 py-4 text-sm md:grid-cols-[1.2fr_1.4fr_.7fr_.7fr_.8fr] md:items-center md:gap-4"
              >
                <div>
                  <b>{s.zone?.name ?? 'Zone'}</b>
                  <p className="text-xs text-stone-500">
                    {s.zone?.city}, {s.zone?.state}
                  </p>
                </div>
                <div>
                  {display(s.startsAt)}
                  <p className="text-xs text-stone-500">Until {display(s.endsAt)}</p>
                </div>
                <div>
                  {s.bookedCount} / {s.capacity}
                </div>
                <div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}
                  >
                    {s.active ? 'Published' : 'Hidden'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void edit(s)}
                    className="rounded-lg border px-3 py-2 text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void toggle(s)}
                    className="rounded-lg border px-3 py-2 text-xs font-semibold"
                  >
                    {s.active ? 'Hide' : 'Publish'}
                  </button>
                  <button
                    onClick={() => void remove(s)}
                    disabled={s.bookedCount > 0}
                    title={s.bookedCount > 0 ? 'Cannot delete a booked schedule' : 'Delete'}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="p-8 text-center text-sm text-stone-500">
              No delivery schedules yet. Publish the first one above.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
