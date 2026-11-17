'use client';

import { createContext, useCallback, useContext, type ReactNode } from 'react';
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
  });

  const refreshSession = useCallback(() => mutate(), [mutate]);

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
