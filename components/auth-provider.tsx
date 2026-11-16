'use client';

import { createContext, useContext, type ReactNode } from 'react';
import useSWR from 'swr';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
};
type SessionResponse = { user: AuthUser | null };
type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  refreshSession: () => Promise<SessionResponse | undefined>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchSession(url: string): Promise<SessionResponse> {
  const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
  if (!response.ok) throw new Error('Your session could not be loaded.');
  return response.json() as Promise<SessionResponse>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, mutate } = useSWR<SessionResponse>('/api/auth/session', fetchSession, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  return (
    <AuthContext.Provider
      value={{ user: data?.user ?? null, isLoading, refreshSession: () => mutate() }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
