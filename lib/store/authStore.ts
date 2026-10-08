import { create } from 'zustand';

import { apiFetch, getCsrfToken, onSessionExpired } from '@/lib/api-client';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setHydrated: (isHydrated) => set({ isHydrated }),
  setError: (error) => set({ error }),

  logout: async () => {
    let succeeded = false;
    try {
      const csrf = getCsrfToken();
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: csrf ? { 'X-CSRF-Token': csrf } : {},
      });
      succeeded = res.ok;
    } catch {
      succeeded = false;
    } finally {
      set({ user: null, error: null });
    }
    return succeeded;
  },
}));

onSessionExpired(() => {
  useAuthStore.getState().setUser(null);
});

let hydrationPromise: Promise<User | null> | null = null;

async function fetchSession(): Promise<User | null> {
  const { setUser, setHydrated } = useAuthStore.getState();

  try {
    const res = await apiFetch('/api/auth/me', { cache: 'no-store' });

    if (res.status === 401 || res.status === 403) {
      setUser(null);
      return null;
    }

    if (!res.ok) return useAuthStore.getState().user;

    const data = await res.json();
    const user: User | null = data?.user ?? null;
    setUser(user);
    return user;
  } catch {
    return useAuthStore.getState().user;
  } finally {
    setHydrated(true);
  }
}

export function hydrateSession(): Promise<User | null> {
  if (!hydrationPromise) {
    hydrationPromise = fetchSession().finally(() => {
      hydrationPromise = null;
    });
  }
  return hydrationPromise;
}