'use client';
import { useEffect, useState } from 'react';
type Rider = {
  id: string;
  phone: string;
  vehicleType: string;
  vehicleColor: string;
  plateNumber: string;
  verificationStatus: string;
  isActive: boolean;
  isAvailable: boolean;
  user: { name: string; email: string; role: string };
  zones: { zone: { name: string; city: string } }[];
};
export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [error, setError] = useState('');
  async function load() {
    const r = await fetch('/api/admin/riders');
    const d = await r.json();
    if (r.ok) setRiders(d.riders ?? []);
    else setError(d.error ?? 'Unable to load riders');
  }
  useEffect(() => {
    void load();
  }, []);
  async function update(
    r: Rider,
    verificationStatus: 'approved' | 'rejected' | 'pending',
    isActive: boolean,
  ) {
    const res = await fetch(`/api/admin/riders/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationStatus, isActive }),
    });
    const d = await res.json();
    if (!res.ok) {
      setError(d.error ?? 'Unable to update rider');
      return;
    }
    await load();
  }
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="text-3xl font-bold">Rider management</h1>
      <p className="mt-2 text-gray-600">
        Review rider applications, approve accounts and control activation.
      </p>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      <div className="mt-6 grid gap-4">
        {riders.map((r) => (
          <article key={r.id} className="rounded-xl border p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="font-semibold">{r.user.name}</h2>
                <p className="text-sm text-gray-600">
                  {r.user.email} · {r.phone}
                </p>
                <p className="mt-2 text-sm">
                  {r.vehicleType} · {r.vehicleColor} · {r.plateNumber}
                </p>
                <p className="text-sm text-gray-600">
                  Zones:{' '}
                  {r.zones.map((z) => `${z.zone.name} (${z.zone.city})`).join(', ') || 'None'}
                </p>
              </div>
              <div className="text-sm">
                Review: <b>{r.verificationStatus}</b>
                <br />
                Active: {String(r.isActive)}
                <br />
                Available: {String(r.isAvailable)}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => update(r, 'approved', true)}
                className="rounded bg-black px-3 py-2 text-sm text-white"
              >
                Approve & activate
              </button>
              <button
                onClick={() => update(r, 'rejected', false)}
                className="rounded border px-3 py-2 text-sm"
              >
                Reject
              </button>
              <button
                onClick={() => update(r, r.verificationStatus, !r.isActive)}
                className="rounded border px-3 py-2 text-sm"
              >
                {r.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
