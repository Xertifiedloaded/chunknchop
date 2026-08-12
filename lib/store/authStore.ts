import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User } from '@/lib/types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);

export async function restoreSession() {
  try {
    const csrf = (function () {
      if (typeof document === 'undefined') return null;
      const name = 'csrfToken=';
      const ca = document.cookie.split(';');
      for (let c of ca) {
        c = c.trim();
        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
      }
      return null;
    })();

    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const accessToken = data?.accessToken || null;
    if (accessToken) {
      useAuthStore.getState().setAccessToken(accessToken);
    }
    return accessToken;
  } catch {
    return null;
  }
}
