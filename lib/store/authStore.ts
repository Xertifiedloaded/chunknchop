import { create } from 'zustand';

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
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,
  isHydrated: false,
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),
  setError: (error) => set({ error }),

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof document !== 'undefined'
            ? (function () {
                const name = 'csrfToken=';
                const ca = document.cookie.split(';');
                for (let c of ca) {
                  c = c.trim();
                  if (c.indexOf(name) === 0) return { 'X-CSRF-Token': c.substring(name.length) };
                }
                return {} as Record<string, string>;
              })()
            : {}),
        },
      });
    } catch (e) {
    } finally {
      set({ user: null });
    }
  },
}));

export async function hydrateSession() {
  try {
    const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'include' });
    if (!res.ok) {
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setHydrated(true);
      return null;
    }

    const data = await res.json();
    if (data?.user) {
      useAuthStore.getState().setUser(data.user);
    } else {
      useAuthStore.getState().setUser(null);
    }
    useAuthStore.getState().setHydrated(true);
    return data?.user || null;
  } catch (e) {
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setHydrated(true);
    return null;
  }
}
