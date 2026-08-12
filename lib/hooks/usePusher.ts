'use client';

import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { useAuthStore } from '@/lib/store/authStore';

export function usePusher(channel: string, event: string, callback: (data: any) => void) {
  const { user, accessToken } = useAuthStore();
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    if (!user) return;

    // Initialize Pusher with server-side auth endpoint so private channels work
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: '/api/notifications/pusher-auth',
        auth: {
          headers: {
            // include access token for server-side authentication if available
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        },
      });
    }

    const pusherChannel = pusherRef.current.subscribe(channel);
    pusherChannel.bind(event, callback);

    return () => {
      pusherChannel.unbind(event, callback);
      pusherRef.current?.unsubscribe(channel);
    };
  }, [user, accessToken, channel, event, callback]);
}
