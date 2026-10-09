let refreshPromise: Promise<boolean> | null = null;
let expiredHandler: (() => void) | null = null;

export function onSessionExpired(handler: () => void) {
  expiredHandler = handler;
}

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("csrfToken="));
  return entry ? decodeURIComponent(entry.slice("csrfToken=".length)) : null;
}

export function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    const csrf = getCsrfToken();
    refreshPromise = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: csrf ? { "X-CSRF-Token": csrf } : {},
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();

  const send = () => {
    const headers = new Headers(init.headers);
    const csrf = getCsrfToken();
    if (csrf && method !== "GET" && method !== "HEAD")
      headers.set("X-CSRF-Token", csrf);
    return fetch(input, { ...init, headers, credentials: "include" });
  };

  const first = await send();
  if (first.status !== 401) return first;

  if (!(await refreshSession())) {
    expiredHandler?.();
    return first;
  }

  const retry = await send();
  if (retry.status === 401) expiredHandler?.();
  return retry;
}
