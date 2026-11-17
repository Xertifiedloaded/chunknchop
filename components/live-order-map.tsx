
'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const MapView = dynamic(() => import('@/components/live-order-map-view'), {
  ssr: false,
  loading: () => (
    <div
      className="flex min-h-[280px] items-center justify-center bg-[#f8f8f6] px-5 text-sm text-[#88847d]"
      role="status"
    >
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
      <div className="flex min-h-[150px] items-center justify-center gap-3 border border-dashed border-[#e6e4de] bg-[#faf9f6] px-5 py-8 text-center">
        <MapPin size={20} className="shrink-0 text-[#e86b3e]" />
        <span className="max-w-sm text-sm leading-6 text-[#88847d]">
          Live location will appear here once your rider starts the delivery.
        </span>
      </div>
    );

  return (
    <div className="w-full overflow-hidden border border-[#e6e4de] bg-white">
      <MapView
        latitude={location.latitude}
        longitude={location.longitude}
      />

      {updatedAt && (
        <p className="border-t border-[#e6e4de] bg-[#faf9f6] px-4 py-3 text-[10px] font-bold tracking-[0.12em] text-[#88847d]">
          RIDER LOCATION · UPDATED{' '}
          {new Date(updatedAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  );
}
