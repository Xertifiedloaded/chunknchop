'use client';

import { useEffect, useState } from 'react';

type Notice = {
  _id: string;
  title: string;
  body: string;
  url: string;
  read?: boolean;
  createdAt: string;
};

function decodeKey(value: string) {
  const pad = '='.repeat((4 - (value.length % 4)) % 4);
  const base = (value + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export default function PwaNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSupported(
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window,
    );
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
    if ('Notification' in window) setPermission(Notification.permission);

    const refresh = () =>
      void fetch('/api/notifications', { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => setItems(data?.notifications ?? []))
        .catch(() => undefined);

    refresh();
    const poll = window.setInterval(refresh, 45000);
    return () => window.clearInterval(poll);
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error('Push notifications are not configured yet.');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(key),
      });
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });
      if (!response.ok) throw new Error('Could not save notification settings.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not enable notifications.');
    } finally {
      setBusy(false);
    }
  }

  async function markRead(id?: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id } : { all: true }),
    });
    setItems((old) =>
      old.map((notice) => (!id || notice._id === id ? { ...notice, read: true } : notice)),
    );
  }

  const unread = items.filter((notice) => !notice.read).length;

  return (
    <div className="fixed bottom-4 right-4 z-[80] flex items-center gap-2">
      {supported && permission !== 'granted' && (
        <button
          disabled={busy}
          onClick={enable}
          className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-800 shadow-lg"
        >
          {busy ? 'Enabling…' : 'Enable alerts'}
        </button>
      )}
      <div className="relative">
        <button
          aria-label="Notifications"
          onClick={() => setOpen(!open)}
          className="grid h-12 w-12 place-items-center rounded-full bg-[#24231f] text-xl text-white shadow-lg"
        >
          ♢
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold">
              {unread}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute bottom-14 right-0 w-[min(92vw,360px)] rounded-2xl border border-stone-200 bg-white p-4 text-stone-900 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <strong>Notifications</strong>
              <button onClick={() => void markRead()} className="text-xs text-[#9b4c2e]">
                Mark all read
              </button>
            </div>
            <div className="max-h-96 space-y-2 overflow-auto">
              {items.length ? (
                items.map((notice) => (
                  <a
                    key={notice._id}
                    href={notice.url}
                    onClick={() => void markRead(notice._id)}
                    className={`block rounded-xl p-3 ${notice.read ? 'bg-stone-50' : 'bg-orange-50'}`}
                  >
                    <p className="text-sm font-bold">{notice.title}</p>
                    <p className="mt-1 text-xs text-stone-600">{notice.body}</p>
                    <p className="mt-2 text-[10px] text-stone-400">
                      {new Date(notice.createdAt).toLocaleString()}
                    </p>
                  </a>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-stone-500">No notifications yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
