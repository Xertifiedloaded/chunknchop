import { useAuthStore } from './store/authStore';

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
  const headers = new Headers(init?.headers || {});

  const reqInit: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
  };

  const res = await fetch(input, reqInit);

  if (res.status !== 401) {
    return res;
  }

  try {
    const csrf = getCsrfFromCookie();
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
      },
    });

    if (!refreshRes.ok) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.replace('/auth/login');
      }
      return res;
    }

    // After refresh, accessToken cookie should be updated server-side. Retry original request once.
    const retryRes = await fetch(input, reqInit);
    if (retryRes.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.replace('/auth/login');
      }
    }
    return retryRes;
  } catch {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined') {
      window.location.replace('/auth/login');
    }
    return res;
  }
}

function getCsrfFromCookie() {
  if (typeof document === 'undefined') return null;
  const name = 'csrfToken=';
  const ca = document.cookie.split(';');
  for (let c of ca) {
    c = c.trim();
    if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
  }
  return null;
}
