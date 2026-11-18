'use client';
import { useEffect, useState, type FormEvent } from 'react';
type Zone = { id: string; name: string; city: string; state: string };
export default function RiderRegisterPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneIds, setZoneIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    phone: '',
    residentialAddress: '',
    vehicleType: 'motorcycle',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleColor: '',
    plateNumber: '',
    licenseNumber: '',
    photoUrl: '',
    licenseImageUrl: '',
  });
  useEffect(() => {
    fetch('/api/delivery/zones')
      .then((r) => r.json())
      .then((d) => setZones(d.zones ?? []))
      .catch(() => setError('Unable to load delivery zones'));
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch('/api/rider/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...f, zoneIds }),
    });
    const d = await r.json();
    setBusy(false);
    setError(r.ok ? d.message : (d.error ?? 'Unable to submit application'));
  }
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-bold">Rider registration</h1>
      <p className="mt-2 text-gray-600">Submit your details for administrator verification.</p>
      <form onSubmit={submit} className="mt-8 grid gap-4 rounded-2xl border p-6 sm:grid-cols-2">
        {Object.entries(f).map(([key, value]) => (
          <label key={key} className="grid gap-1 text-sm font-medium">
            {key.replace(/[A-Z]/g, ' $&')}
            <input
              required={['phone', 'residentialAddress', 'vehicleColor', 'plateNumber'].includes(
                key,
              )}
              value={value}
              onChange={(e) => setF({ ...f, [key]: e.target.value })}
              className="rounded-lg border px-3 py-3"
            />
          </label>
        ))}
        <label className="grid gap-1 text-sm font-medium">
          Vehicle type
          <select
            value={f.vehicleType}
            onChange={(e) => setF({ ...f, vehicleType: e.target.value })}
            className="rounded-lg border px-3 py-3"
          >
            <option value="motorcycle">Motorcycle</option>
            <option value="car">Car</option>
            <option value="van">Van</option>
            <option value="other">Other</option>
          </select>
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-semibold">Delivery zones you can serve</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {zones.map((z) => (
              <label key={z.id} className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={zoneIds.includes(z.id)}
                  onChange={(e) =>
                    setZoneIds(
                      e.target.checked ? [...zoneIds, z.id] : zoneIds.filter((x) => x !== z.id),
                    )
                  }
                />
                {z.name}, {z.city}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="sm:col-span-2">
          <button
            disabled={busy || !zoneIds.length}
            className="rounded-lg bg-black px-5 py-3 font-semibold text-white"
          >
            {busy ? 'Submitting…' : 'Submit rider application'}
          </button>
          {error && <p className="mt-3 text-sm">{error}</p>}
        </div>
      </form>
    </main>
  );
}
