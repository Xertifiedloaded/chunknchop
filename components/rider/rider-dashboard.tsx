'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { Check, LoaderCircle, MapPin, Navigation, PackageCheck } from 'lucide-react';
import { formatPrice } from '@/lib/catalog';
import OrderConversation from '@/components/orders/order-conversation';

type RiderOrder = {
  orderNumber: string;
  status: string;
  subtotalCents: number;
  createdAt: string;
  delivery: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    region: string;
    postalCode: string;
  };
  items: Array<{ name: string; quantity: number; unit: string }>;
  riderLocation?: { latitude: number; longitude: number; updatedAt: string } | null;
};

type RiderOrdersResponse = { orders: RiderOrder[] };

async function fetchRiderOrders(url: string): Promise<RiderOrdersResponse> {
  const response = await fetch(url, { cache: 'no-store' });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || 'Could not load your assigned deliveries.');
  }

  return result;
}

const nextStatus: Record<string, { status: string; label: string }> = {
  assigned: { status: 'picked_up', label: 'MARK PICKED UP' },
  picked_up: { status: 'out_for_delivery', label: 'START DELIVERY' },
  out_for_delivery: { status: 'delivered', label: 'MARK DELIVERED' },
};

const statusStyles: Record<string, string> = {
  assigned: 'border-[#e9d7c7] bg-[#f8f1eb] text-[#a9442c]',
  picked_up: 'border-[#e9d7c7] bg-[#f8f1eb] text-[#a9442c]',
  out_for_delivery: 'border-[#e9d7c7] bg-[#f8f1eb] text-[#a9442c]',
  delivered: 'border-[#dce5d5] bg-[#eff2e9] text-[#53623f]',
};

export default function RiderDashboard({ name }: { name: string }) {
  const { data, error, isLoading, mutate } = useSWR<RiderOrdersResponse>(
    '/api/rider/orders',
    fetchRiderOrders,
    { refreshInterval: 10_000 },
  );

  const [trackingOrder, setTrackingOrder] = useState<string | null>(null);
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const watchId = useRef<number | null>(null);
  const lastSentAt = useRef(0);
  const orders = data?.orders ?? [];

  useEffect(
    () => () => {
      if (watchId.current !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchId.current);
      }
    },
    [],
  );

  function stopLocationSharing() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    watchId.current = null;
    setTrackingOrder(null);
    setFeedback('Live location sharing stopped.');
  }

  function startLocationSharing(orderNumber: string) {
    if (!navigator.geolocation) {
      setFeedback('This device does not support location sharing.');
      return;
    }

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    setFeedback('Waiting for your location permission…');
    setTrackingOrder(orderNumber);

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        if (Date.now() - lastSentAt.current < 4_000) return;

        lastSentAt.current = Date.now();

        const response = await fetch(
          `/api/rider/orders/${encodeURIComponent(orderNumber)}/location`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          },
        );

        if (!response.ok) {
          const result = await response.json().catch(() => null);
          setFeedback(result?.error || 'Location update could not be shared.');
          return;
        }

        setFeedback('Your location is being shared with the customer.');
        await mutate();
      },
      (locationError) => {
        setFeedback(
          locationError.code === locationError.PERMISSION_DENIED
            ? 'Location access was denied. Allow location access to share your route.'
            : 'Unable to read this device’s location.',
        );

        setTrackingOrder(null);
        watchId.current = null;
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );
  }

  async function advanceOrder(order: RiderOrder) {
    const next = nextStatus[order.status];
    if (!next) return;

    setBusyOrder(order.orderNumber);
    setFeedback('');

    try {
      const response = await fetch(
        `/api/rider/orders/${encodeURIComponent(order.orderNumber)}/status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next.status }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'Could not update this delivery.');
      }

      setFeedback(`${order.orderNumber}: ${next.label.toLowerCase().replaceAll('_', ' ')}.`);

      await mutate();

      if (next.status === 'delivered' && trackingOrder === order.orderNumber) {
        stopLocationSharing();
      }
    } catch (updateError) {
      setFeedback(
        updateError instanceof Error ? updateError.message : 'Could not update this delivery.',
      );
    } finally {
      setBusyOrder(null);
    }
  }

  return (
    <div className="mx-auto w-[min(1120px,90%)] py-[30px] pb-[70px] max-[650px]:w-[92%] max-[650px]:pt-[18px]">
      <div className="flex min-h-[220px] items-center justify-between gap-[25px] bg-[#332925] px-9 py-[30px] text-white max-[650px]:min-h-0 max-[650px]:flex-col max-[650px]:items-start max-[650px]:px-5 max-[650px]:py-[25px]">
        <div>
          <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#e4ddd4]">
            <span className="h-px w-[19px] bg-[#e86b3e]" />
            ChunknChop· DELIVERY
          </p>

          <h1 className="my-4 mb-[11px] text-[clamp(37px,4.5vw,53px)] font-normal leading-[0.98] tracking-[-0.05em]">
            Good morning,
            <br />
            <em className="font-heading text-[#e9a17d]">{name || 'rider'}.</em>
          </h1>

          <p className="m-0 max-w-[450px] text-[10px] leading-[1.7] text-[#ddd5cc]">
            Your route, your updates. Customers see your delivery status and shared location here.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 border border-[#75675f] px-3 py-[10px] text-[8px] font-bold tracking-[0.09em] text-[#eee9e2] whitespace-nowrap">
          <span className="size-2 rounded-full bg-[#8a877d]" />
          {trackingOrder ? 'LOCATION SHARING ON' : 'LOCATION SHARING OFF'}
        </div>
      </div>

      <section className="mt-7 border border-[#eae9e5] bg-white p-[25px] max-[650px]:px-[13px] max-[650px]:py-[18px]">
        <div className="mb-[15px] flex items-end justify-between gap-4">
          <div>
            <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
              <span className="h-px w-[19px] bg-[#e86b3e]" />
              TODAY’S ROUTE
            </p>
            <h2 className="mt-[9px] font-heading text-[25px] font-normal text-[#24231f]">
              Assigned deliveries
            </h2>
          </div>

          <span className="text-[11px] text-[#77736d]">
            {orders.filter((order) => order.status !== 'delivered').length} active
          </span>
        </div>

        {feedback && (
          <p
            className="my-[10px] bg-[#eff2e9] px-3 py-[10px] text-[10px] leading-[1.6] text-[#53623f]"
            role="status"
            aria-live="polite"
          >
            {feedback}
          </p>
        )}

        {isLoading ? (
          <p className="flex min-h-[80px] items-center gap-2 text-[11px] text-[#77736d]">
            <LoaderCircle className="animate-spin" size={16} />
            Loading your route…
          </p>
        ) : error ? (
          <p className="flex min-h-[80px] items-center text-[11px] text-[#77736d]" role="alert">
            {error.message}
          </p>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[210px] flex-col items-center justify-center text-center text-[#a9442c]">
            <PackageCheck size={25} />
            <h3 className="mt-3 mb-[5px] font-heading text-[22px] font-normal text-[#24231f]">
              No deliveries assigned.
            </h3>
            <p className="mb-4 max-w-[360px] text-[10px] leading-[1.7] text-[#77736d]">
              Your assigned orders will appear here. Refreshing automatically every few seconds.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[13px] max-[850px]:grid-cols-1">
            {orders.map((order) => {
              const next = nextStatus[order.status];

              return (
                <article
                  className="min-w-0 border border-[#eae9e5] p-[18px] max-[650px]:p-[14px]"
                  key={order.orderNumber}
                >
                  <div className="flex items-center justify-between gap-2 text-[8px] text-[#77736d]">
                    <span
                      className={`inline-flex items-center border px-[9px] py-[7px] text-[8px] font-bold tracking-[0.08em] uppercase ${
                        statusStyles[order.status] || 'border-[#eae9e5] bg-[#fbfaf7] text-[#77736d]'
                      }`}
                    >
                      {order.status.replaceAll('_', ' ')}
                    </span>

                    <span>{order.orderNumber}</span>
                  </div>

                  <div className="mt-[17px] flex items-end justify-between gap-3">
                    <div>
                      <p className="m-0 flex items-center gap-[9px] text-[8px] font-bold tracking-[0.15em] text-[#77736d]">
                        <span className="h-px w-[19px] bg-[#e86b3e]" />
                        DELIVER TO
                      </p>
                      <h3 className="mt-[6px] font-heading text-[19px] font-normal">
                        {order.delivery.fullName}
                      </h3>
                    </div>

                    <strong className="text-[11px]">{formatPrice(order.subtotalCents)}</strong>
                  </div>

                  <address className="my-3 text-[10px] leading-[1.8] text-[#77736d] not-italic">
                    {order.delivery.addressLine1}
                    {order.delivery.addressLine2 && `, ${order.delivery.addressLine2}`}
                    <br />
                    {order.delivery.city}, {order.delivery.region} {order.delivery.postalCode}
                    <br />
                    <a
                      className="text-[#a9442c] underline decoration-1 underline-offset-2"
                      href={`tel:${order.delivery.phone}`}
                    >
                      {order.delivery.phone}
                    </a>
                  </address>

                  <div className="flex flex-wrap gap-[5px] border-y border-[#eae9e5] py-[11px]">
                    {order.items.map((item) => (
                      <span
                        className="bg-[#f8f5ef] px-[7px] py-[5px] text-[8px] text-[#514f49]"
                        key={`${item.name}-${item.unit}`}
                      >
                        {item.name} × {item.quantity}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.status !== 'delivered' && (
                      <button
                        type="button"
                        className={`inline-flex min-h-[37px] items-center justify-center gap-[7px] border px-[9px] text-[8px] font-bold tracking-[0.04em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#e86b3e] ${
                          trackingOrder === order.orderNumber
                            ? 'border-[#a9442c] bg-white text-[#a9442c]'
                            : 'border-[#d6d1c7] bg-white text-[#514f49] hover:border-[#a9442c] hover:text-[#a9442c]'
                        }`}
                        onClick={() =>
                          trackingOrder === order.orderNumber
                            ? stopLocationSharing()
                            : startLocationSharing(order.orderNumber)
                        }
                      >
                        <Navigation size={15} />
                        {trackingOrder === order.orderNumber
                          ? 'STOP SHARING'
                          : 'SHARE LIVE LOCATION'}
                      </button>
                    )}

                    {next && (
                      <button
                        type="button"
                        className="inline-flex min-h-[37px] items-center justify-center gap-[10px] border border-[#292621] bg-[#292621] px-[9px] text-[8px] font-bold tracking-[0.08em] text-white transition-colors hover:border-[#a9442c] hover:bg-[#a9442c] disabled:cursor-not-allowed disabled:opacity-[0.58]"
                        disabled={busyOrder === order.orderNumber}
                        onClick={() => void advanceOrder(order)}
                      >
                        {busyOrder === order.orderNumber ? (
                          <LoaderCircle className="animate-spin" size={15} />
                        ) : next.status === 'delivered' ? (
                          <Check size={15} />
                        ) : (
                          <MapPin size={15} />
                        )}
                        {next.label}
                      </button>
                    )}

                    {order.status === 'delivered' && (
                      <span className="inline-flex items-center gap-[6px] text-[8px] font-bold tracking-[0.08em] text-[#53623f]">
                        <Check size={15} />
                        COMPLETED
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                    className="mt-[14px] inline-block text-[8px] font-bold tracking-[0.08em] text-[#77736d] hover:text-[#a9442c]"
                  >
                    OPEN CUSTOMER TRACKING <span aria-hidden="true">↗</span>
                  </Link>

                  <OrderConversation orderNumber={order.orderNumber} viewer="rider" />
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
