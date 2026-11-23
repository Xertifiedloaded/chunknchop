
const CACHE_NAME = 'chunknchop-shell-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await caches.open(CACHE_NAME);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter((key) => key.startsWith('chunknchop-shell-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      body: event.data?.text() || 'You have a new update.',
    };
  }

  const title = payload.title || 'ChunkNChop';

  const options = {
    body: payload.body || 'You have a new update.',
    icon: payload.icon || '/pwa-icon.svg',
    badge: payload.badge || '/pwa-icon.svg',
    tag: payload.tag || 'chunk-n-chop-update',
    renotify: Boolean(payload.renotify),
    timestamp: Date.now(),
    data: {
      url: payload.url || '/',
      ...(payload.data || {}),
    },
    actions: [
      {
        action: 'open',
        title: 'View update',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    (async () => {
      const rawUrl = event.notification.data?.url || '/';

      let target;

      try {
        target = new URL(rawUrl, self.location.origin);
      } catch {
        target = new URL('/', self.location.origin);
      }

      // Never navigate notifications to another origin.
      if (target.origin !== self.location.origin) {
        target = new URL('/', self.location.origin);
      }

      const clientsList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of clientsList) {
        if (client.url.startsWith(self.location.origin)) {
          await client.navigate(target.href);
          return client.focus();
        }
      }

      return self.clients.openWindow(target.href);
    })(),
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const subscription = await self.registration.pushManager.getSubscription();

      if (!subscription) return;

      // Let the application restore/re-register the subscription when it next opens.
      const clientsList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of clientsList) {
        client.postMessage({
          type: 'PUSH_SUBSCRIPTION_CHANGED',
        });
      }
    })(),
  );
});
