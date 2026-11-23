'use client';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Same fingerprint as getVapidKeyId() on the server. */
async function getVapidKeyId(publicKey: string): Promise<string> {
  const bytes = urlBase64ToUint8Array(publicKey);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

function sameKey(a: ArrayBuffer | null, b: Uint8Array): boolean {
  if (!a) return false;
  const x = new Uint8Array(a);
  return x.length === b.length && x.every((v, i) => v === b[i]);
}

function getAnonymousId(): string {
  const storageKey = 'push-anonymous-id';
  let id = localStorage.getItem(storageKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(storageKey, id);
  }
  return id;
}

export async function subscribeToPush(): Promise<boolean> {
  if (
    !PUBLIC_KEY ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return false;
  }

  if (Notification.permission === 'denied') return false;

  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission();
    if (result !== 'granted') return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const applicationServerKey = urlBase64ToUint8Array(PUBLIC_KEY);

  // Drop any subscription created under a different VAPID key.
  const existing = await registration.pushManager.getSubscription();

  if (
    existing &&
    !sameKey(existing.options.applicationServerKey, applicationServerKey)
  ) {
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: existing.endpoint,
        anonymousId: getAnonymousId(),
      }),
    }).catch(() => undefined);

    await existing.unsubscribe();
  }

  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    }));

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      anonymousId: getAnonymousId(),
      vapidKeyId: await getVapidKeyId(PUBLIC_KEY),
    }),
  });

  return res.ok;
}