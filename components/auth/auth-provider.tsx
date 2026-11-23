'use client';

import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import useSWR from 'swr';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
};

type SessionResponse = {
  user: AuthUser | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  refreshSession: () => Promise<SessionResponse | undefined>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchSession(url: string): Promise<SessionResponse> {
  const response = await fetch(url, {
    cache: 'no-store',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error('Your session could not be loaded.');
  }

  const result = (await response.json()) as SessionResponse;

  return {
    user: result.user
      ? {
          ...result.user,
          role: String(result.user.role ?? 'CUSTOMER')
            .trim()
            .toUpperCase(),
        }
      : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, mutate } = useSWR<SessionResponse>('/api/auth/session', fetchSession, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    shouldRetryOnError: false,
    dedupingInterval: 2000,
    refreshInterval: 15 * 60 * 1000,
  });

  const refreshSession = useCallback(() => mutate(), [mutate]);

  useEffect(() => {
    if (!data?.user || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || Notification.permission !== 'granted') return;
    void (async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) return;
        const anonymousId = localStorage.getItem('chunknchop-anonymous-push-id') || crypto.randomUUID();
        localStorage.setItem('chunknchop-anonymous-push-id', anonymousId);
        await fetch('/api/notifications/subscribe', {
          method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription, anonymousId }),
        });
      } catch {}
    })();
  }, [data?.user?.id]);

  return (
    <AuthContext.Provider
      value={{
        user: data?.user ?? null,
        isLoading,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
