"use client";

import useSWR from "swr";
import { useState, useCallback } from "react";
import { usePusher } from "@/hooks/usePusher";

const jsonFetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLiveLocation({
  apiUrl,
  pusherChannel,
  event = "location-update",
}: {
  apiUrl?: string | null;
  pusherChannel: string;
  event?: string;
}) {
  const { data, mutate } = useSWR(apiUrl ?? null, jsonFetcher, {
    revalidateOnFocus: false,
  });
  const [live, setLive] = useState(() => data ?? null);

  if (data && (!live || data.timestamp !== live.timestamp)) {
    setLive(data);
  }

  const onUpdate = useCallback(
    (payload: any) => {
      setLive(payload);
      if (apiUrl) mutate(payload, false);
    },
    [apiUrl, mutate],
  );

  usePusher(pusherChannel, event, onUpdate);

  const sendLocation = useCallback(
    async (payload: { latitude: number; longitude: number; bearing?: number; speed?: number; orderId?: string; riderId?: string }) => {
      let url = "/api/order/location";
      if (pusherChannel.startsWith("private-rider")) url = "/api/rider/location";
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return await res.json();
      } catch (err) {
        console.error("sendLocation error", err);
        throw err;
      }
    },
    [pusherChannel],
  );

  return { location: live, sendLocation };
}
