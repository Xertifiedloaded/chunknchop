import { useAuthStore } from './store/authStore';

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
  const token = useAuthStore.getState().accessToken;

  const headers = new Headers(init?.headers || {});
  if (token) {
    headers.set('Authorization', 'Bearer ' + token);
  }

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
      return res;
    }

    const data = await refreshRes.json();
    const newAccessToken = data?.accessToken;
    if (newAccessToken) {
      useAuthStore.getState().setAccessToken(newAccessToken);
      headers.set('Authorization', 'Bearer ' + newAccessToken);
      const retryInit: RequestInit = { ...reqInit, headers };
      return fetch(input, retryInit);
    }

    useAuthStore.getState().logout();
    return res;
  } catch {
    useAuthStore.getState().logout();
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
