'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Pusher from 'pusher-js';
import OrderChat from '@/components/delivery/order-chat';
type Tracking = {
  status?: string;
  paymentStatus?: string;
  rider?: {
    name?: string;
    location?: { latitude: number; longitude: number; updatedAt: string };
  } | null;
};
export default function TrackOrderPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params.orderNumber;
  const [data, setData] = useState<Tracking>({});
  const [error, setError] = useState('');
  async function refresh() {
    const r = await fetch(`/api/orders/${orderNumber}/tracking`, { cache: 'no-store' });
    const d = await r.json();
    if (r.ok) setData(d);
    else setError(d.error ?? 'Unable to load tracking');
  }
  useEffect(() => {
    void refresh();
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;
    const p = new Pusher(key, {
      cluster,
      channelAuthorization: { endpoint: '/api/pusher/auth', transport: 'ajax' },
    });
    const ch = p.subscribe(`private-order-${orderNumber}`);
    ch.bind(
      'delivery.location',
      (location: { latitude: number; longitude: number; updatedAt: string }) =>
        setData((old) => ({ ...old, rider: { ...old.rider, location } })),
    );
    ch.bind('delivery.status', refresh);
    ch.bind('delivery.assigned', refresh);
    return () => {
      p.unsubscribe(`private-order-${orderNumber}`);
      p.disconnect();
    };
  }, [orderNumber]);
  const loc = data.rider?.location;
  const mapUrl = loc ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}` : undefined;
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-12">
      <h1 className="text-3xl font-bold">Track your delivery</h1>
      <p className="mt-2 text-gray-600">Order {orderNumber}</p>
      {error && <p className="mt-5 text-red-600">{error}</p>}
      <section className="mt-6 rounded-2xl border p-6">
        <p className="text-sm text-gray-500">Delivery status</p>
        <h2 className="mt-1 text-2xl font-semibold capitalize">
          {(data.status ?? 'Loading').replaceAll('_', ' ')}
        </h2>
        {data.rider && (
          <p className="mt-4">
            Your rider: <b>{data.rider.name ?? 'Assigned rider'}</b>
          </p>
        )}
        {loc ? (
          <>
            <p className="mt-3 text-sm text-gray-600">
              Last location update: {new Date(loc.updatedAt).toLocaleString()}
            </p>
            <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-gray-100">
              <iframe
                title="Rider live location"
                className="h-full w-full"
                src={`https://maps.google.com/maps?q=${loc.latitude},${loc.longitude}&z=15&output=embed`}
                loading="lazy"
              />
            </div>
            <a
              className="mt-4 inline-block font-semibold underline"
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open rider location in Google Maps
            </a>
          </>
        ) : (
          <p className="mt-4 text-sm text-gray-600">
            Live location will appear when your rider starts sharing GPS.
          </p>
        )}
      </section>
      <OrderChat orderNumber={orderNumber} />
    </main>
  );
}
