'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { Check, LoaderCircle, MapPin, Navigation, PackageCheck } from 'lucide-react';
import { formatPrice } from '@/lib/catalog';
import OrderConversation from '@/components/order-conversation';

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
  if (!response.ok) throw new Error(result?.error || 'Could not load your assigned deliveries.');
  return result;
}

const nextStatus: Record<string, { status: string; label: string }> = {
  assigned: { status: 'picked_up', label: 'MARK PICKED UP' },
  picked_up: { status: 'out_for_delivery', label: 'START DELIVERY' },
  out_for_delivery: { status: 'delivered', label: 'MARK DELIVERED' },
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
      if (watchId.current !== null && typeof navigator !== 'undefined')
        navigator.geolocation.clearWatch(watchId.current);
    },
    [],
  );

  function stopLocationSharing() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setTrackingOrder(null);
    setFeedback('Live location sharing stopped.');
  }

  function startLocationSharing(orderNumber: string) {
    if (!navigator.geolocation) {
      setFeedback('This device does not support location sharing.');
      return;
    }
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
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
      if (!response.ok) throw new Error(result?.error || 'Could not update this delivery.');
      setFeedback(`${order.orderNumber}: ${next.label.toLowerCase().replaceAll('_', ' ')}.`);
      await mutate();
      if (next.status === 'delivered' && trackingOrder === order.orderNumber) stopLocationSharing();
    } catch (updateError) {
      setFeedback(
        updateError instanceof Error ? updateError.message : 'Could not update this delivery.',
      );
    } finally {
      setBusyOrder(null);
    }
  }

  return (
    <div className="rider-dashboard">
      <div className="rider-welcome">
        <div>
          <p className="eyebrow light">
            <span /> ChunknChop· DELIVERY
          </p>
          <h1>
            Good morning,
            <br />
            <em>{name || 'rider'}.</em>
          </h1>
          <p>
            Your route, your updates. Customers see your delivery status and shared location here.
          </p>
        </div>
        <div className="rider-shift-indicator">
          <span /> {trackingOrder ? 'LOCATION SHARING ON' : 'LOCATION SHARING OFF'}
        </div>
      </div>
      <section className="rider-route-section">
        <div className="order-history-heading">
          <div>
            <p className="eyebrow">
              <span /> TODAY’S ROUTE
            </p>
            <h2>Assigned deliveries</h2>
          </div>
          <span>{orders.filter((order) => order.status !== 'delivered').length} active</span>
        </div>
        {feedback && (
          <p className="rider-feedback" role="status" aria-live="polite">
            {feedback}
          </p>
        )}
        {isLoading ? (
          <p className="order-feedback">
            <LoaderCircle className="auth-spinner" size={16} /> Loading your route…
          </p>
        ) : error ? (
          <p className="order-feedback" role="alert">
            {error.message}
          </p>
        ) : orders.length === 0 ? (
          <div className="order-empty">
            <PackageCheck size={25} />
            <h3>No deliveries assigned.</h3>
            <p>
              Your assigned orders will appear here. Refreshing automatically every few seconds.
            </p>
          </div>
        ) : (
          <div className="rider-order-list">
            {orders.map((order) => {
              const next = nextStatus[order.status];
              return (
                <article className="rider-order-card" key={order.orderNumber}>
                  <div className="rider-order-top">
                    <span className={`order-status-pill order-status-${order.status}`}>
                      {order.status.replaceAll('_', ' ')}
                    </span>
                    <span>{order.orderNumber}</span>
                  </div>
                  <div className="rider-order-customer">
                    <div>
                      <p className="eyebrow">
                        <span /> DELIVER TO
                      </p>
                      <h3>{order.delivery.fullName}</h3>
                    </div>
                    <strong>{formatPrice(order.subtotalCents)}</strong>
                  </div>
                  <address>
                    {order.delivery.addressLine1}
                    {order.delivery.addressLine2 && `, ${order.delivery.addressLine2}`}
                    <br />
                    {order.delivery.city}, {order.delivery.region} {order.delivery.postalCode}
                    <br />
                    <a href={`tel:${order.delivery.phone}`}>{order.delivery.phone}</a>
                  </address>
                  <div className="rider-order-items">
                    {order.items.map((item) => (
                      <span key={`${item.name}-${item.unit}`}>
                        {item.name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                  <div className="rider-order-actions">
                    {order.status !== 'delivered' && (
                      <button
                        type="button"
                        className={
                          trackingOrder === order.orderNumber
                            ? 'rider-location-button is-sharing'
                            : 'rider-location-button'
                        }
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
                        className="admin-primary-button"
                        disabled={busyOrder === order.orderNumber}
                        onClick={() => void advanceOrder(order)}
                      >
                        {busyOrder === order.orderNumber ? (
                          <LoaderCircle className="auth-spinner" size={15} />
                        ) : next.status === 'delivered' ? (
                          <Check size={15} />
                        ) : (
                          <MapPin size={15} />
                        )}{' '}
                        {next.label}
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <span className="rider-delivered">
                        <Check size={15} /> COMPLETED
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                    className="rider-customer-view"
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
