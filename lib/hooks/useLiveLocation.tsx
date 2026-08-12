'use client';

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import { usePusher } from './usePusher';

const jsonFetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLiveLocation({
  apiUrl, // optional initial fetch URL, e.g. `/api/order/location?orderId=...` (should return { latitude, longitude, ... })
  pusherChannel, // e.g. `private-order-<id>` or `private-rider-<id>`
  event = 'location-update',
}: {
  apiUrl?: string | null;
  pusherChannel: string;
  event?: string;
}) {
  // initial data from API (optional)
  const { data, mutate } = useSWR(apiUrl ?? null, jsonFetcher, { revalidateOnFocus: false });
  const [live, setLive] = useState(() => data ?? null);

  // keep local state updated when swr fetch completes
  if (data && (!live || data.timestamp !== live.timestamp)) {
    setLive(data);
  }

  const onUpdate = useCallback(
    (payload: any) => {
      // payload expected: { latitude, longitude, timestamp, ... }
      setLive(payload);
      // update swr cache if apiUrl was used
      if (apiUrl) mutate(payload, false);
    },
    [apiUrl, mutate]
  );

  // subscribe to pusher channel for live updates
  usePusher(pusherChannel, event, onUpdate);

  // helper to push location from client (e.g., rider device)
  const sendLocation = useCallback(
    async (payload: { latitude: number; longitude: number; bearing?: number; speed?: number; orderId?: string; riderId?: string }) => {
      // choose endpoint based on channel name prefix
      let url = '/api/order/location';
      if (pusherChannel.startsWith('private-rider')) url = '/api/rider/location';
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return await res.json();
      } catch (err) {
        console.error('sendLocation error', err);
        throw err;
      }
    },
    [pusherChannel]
  );

  return { location: live, sendLocation };
}
