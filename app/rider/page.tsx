'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useLiveLocation } from '@/lib/hooks/useLiveLocation';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function RiderPage() {
  const [phone, setPhone] = useState('');
  const [rider, setRider] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  const { location, sendLocation } = useLiveLocation({ pusherChannel: token ? `private-rider-${rider?.id}` : 'private-rider-null', event: 'location-update' });

  async function login(e: any) {
    e.preventDefault();
    try {
      const res = await fetch('/api/rider/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
      const data = await res.json();
      if (res.ok) {
        setRider(data.rider);
        setToken(data.accessToken);
        alert('Logged in as ' + (data.rider?.name || data.rider?.phone));
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  }

  async function sendCurrentLocation() {
    if (!rider) return alert('Login first');
    const lat = 6.5244 + Math.random() * 0.01;
    const lng = 3.3792 + Math.random() * 0.01;
    await sendLocation({ riderId: rider.id, latitude: lat, longitude: lng });
    alert('Location sent');
  }

  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-semibold">Rider console</h2>

      {!rider && (
        <form onSubmit={login} className="mb-4">
          <label className="mb-2 block text-sm font-medium">Phone</label>
          <input className="mb-2 w-full rounded border px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 08012345678" />
          <button type="submit" className="rounded bg-[#f15b2a] px-4 py-2 text-white">
            Login
          </button>
        </form>
      )}

      {rider && (
        <div>
          <p className="mb-2">
            Signed in as <strong>{rider.name || rider.phone}</strong>
          </p>
          <div className="mb-2">
            <button onClick={sendCurrentLocation} className="rounded bg-[#0b9762] px-4 py-2 text-white">
              Send sample location
            </button>
          </div>

          <div className="mt-4">
            <h4 className="text-lg font-semibold">Latest live location</h4>
            {location ? <pre className="mt-2 rounded bg-[#f7f7f7] p-3 text-sm">{JSON.stringify(location, null, 2)}</pre> : <p className="mt-2 text-sm text-[#8c857f]">No live updates yet</p>}
          </div>
        </div>
      )}
    </div>
  );
}
