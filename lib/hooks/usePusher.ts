'use client';

import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { useAuthStore } from '@/lib/store/authStore';

export function usePusher(channel: string, event: string, callback: (data: any) => void) {
  const { user } = useAuthStore();
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    if (!user) return;

    // Initialize Pusher
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });
    }

    const pusherChannel = pusherRef.current.subscribe(channel);
    pusherChannel.bind(event, callback);

    return () => {
      pusherChannel.unbind(event, callback);
      pusherRef.current?.unsubscribe(channel);
    };
  }, [user, channel, event, callback]);
}
