'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const MapView = dynamic(() => import('@/components/live-order-map-view'), {
  ssr: false,
  loading: () => (
    <div className="order-map-loading" role="status">
      Preparing the live map…
    </div>
  ),
});

export default function LiveOrderMap({
  location,
  updatedAt,
}: {
  location: { latitude: number; longitude: number } | null;
  updatedAt?: string | null;
}) {
  if (!location)
    return (
      <div className="order-map-empty">
        <MapPin size={20} />
        <span>Live location will appear here once your rider starts the delivery.</span>
      </div>
    );
  return (
    <div className="order-map-wrap">
      <MapView latitude={location.latitude} longitude={location.longitude} />
      {updatedAt && (
        <p className="order-map-updated">
          RIDER LOCATION · UPDATED{' '}
          {new Date(updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
}
