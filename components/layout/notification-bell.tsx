'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, BellRing, LoaderCircle, X, CheckCheck, Clock3, Trash2 } from 'lucide-react';

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
  const raw = atob((value + pad).replace(/-/g, '+').replace(/_/g, '/'));

  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export default function NotificationBell() {
  const [items, setItems] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);

    try {
      const response = await fetch('/api/notifications', {
        cache: 'no-store',
      });

      if (!response.ok) return;

      const data = await response.json();
      setItems(data.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSupported(
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window,
    );

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    void load().catch(() => undefined);

    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 45000);

    return () => window.clearInterval(timer);
  }, []);

  async function enablePush() {
    setBusy(true);
    setError('');

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!key) {
        throw new Error('Push notifications are not configured yet.');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(key),
      });

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription }),
      });

      if (!response.ok) {
        throw new Error('Could not save notification settings.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable notifications.');
    } finally {
      setBusy(false);
    }
  }

  async function markRead(id?: string) {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(id ? { id } : { all: true }),
    });

    if (!response.ok) return;

    setItems((current) =>
      current.map((item) => (!id || item._id === id ? { ...item, read: true } : item)),
    );
  }

  async function clearHistory() {
    const response = await fetch('/api/notifications', {
      method: 'DELETE',
    });

    if (response.ok) {
      setItems([]);
    }
  }

  const unread = items.filter((item) => !item.read).length;

  return (
    <div className="relative">
      {}
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-9 w-9 place-items-center rounded-full text-[#484741] transition-all duration-200 hover:bg-[#f8f7f4] hover:text-[#e86b3e]"
      >
        {unread > 0 ? (
          <BellRing size={18} strokeWidth={1.8} />
        ) : (
          <Bell size={18} strokeWidth={1.8} />
        )}

        {unread > 0 && (
          <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-[#d94d32] px-1 text-[8px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {}
      {open && (
        <>
          {}
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[79] cursor-default bg-black/[0.12] backdrop-blur-[1px]"
          />

          <section
            aria-label="Notifications panel"
            className="fixed left-1/2 top-[72px] z-[80] flex w-[calc(100vw-20px)] max-w-[900px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-[#eeece7] bg-white text-[#29231f] shadow-[0_16px_50px_rgba(0,0,0,0.14)] sm:top-[82px] sm:rounded-[20px]"
            style={{
              maxHeight: 'min(520px, calc(100dvh - 100px))',
            }}
          >
            {}
            <div className="flex shrink-0 items-center justify-between border-b border-[#f0ede8] px-3 py-3 sm:px-5 sm:py-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#fff3ec] text-[#df7148]">
                  <Bell size={15} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[12px] font-bold tracking-tight sm:text-[13px]">
                      Notifications
                    </h3>

                    {unread > 0 && (
                      <span className="rounded-full bg-[#fff1e9] px-2 py-0.5 text-[9px] font-semibold text-[#c65d37]">
                        {unread} new
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-[9px] text-[#938b82] sm:text-[10px]">
                    Your order and delivery updates
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={() => void markRead()}
                    className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#a64e31] transition hover:text-[#d66b43] sm:text-[10px]"
                  >
                    <CheckCheck size={12} />
                    <span>Read all</span>
                  </button>
                )}

                <button
                  type="button"
                  aria-label="Close notifications"
                  onClick={() => setOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-full text-[#827970] transition hover:bg-stone-100 hover:text-[#29231f]"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {}
            {supported && permission !== 'granted' && (
              <div className="shrink-0 border-b border-[#f0ede8] bg-[#fffaf6] px-3 py-2.5 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-[#d97750] shadow-sm">
                      <BellRing size={13} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-[#40372f]">
                        Get delivery alerts
                      </p>
                      <p className="text-[9px] text-[#8b8178]">
                        Receive updates even when the app is closed.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void enablePush()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#29231f] px-3 py-2 text-[9px] font-semibold text-white transition hover:bg-[#493b32] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? (
                      <LoaderCircle size={11} className="animate-spin" />
                    ) : (
                      <Bell size={11} />
                    )}

                    {busy ? 'Enabling...' : 'Enable'}
                  </button>
                </div>

                {error && (
                  <p role="alert" className="mt-2 text-[9px] text-red-600">
                    {error}
                  </p>
                )}
              </div>
            )}

            {}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3">
              {loading && items.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-10 text-[10px] text-[#928980]">
                  <LoaderCircle size={14} className="animate-spin" />
                  Loading notifications...
                </div>
              ) : items.length > 0 ? (
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {items.map((item) => (
                    <Link
                      key={item._id}
                      href={item.url || '/account/orders'}
                      onClick={() => {
                        setOpen(false);

                        if (!item.read) {
                          void markRead(item._id);
                        }
                      }}
                      className={`group relative flex min-w-0 gap-2.5 rounded-xl border p-3 transition-all duration-200 hover:border-[#ead9ce] hover:bg-[#fffaf7] ${
                        item.read
                          ? 'border-transparent bg-[#faf9f7]'
                          : 'border-[#f6e5dc] bg-[#fff6f1]'
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          item.read ? 'bg-transparent' : 'bg-[#e86b3e]'
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-bold text-[#39312b] sm:text-[11px]">
                          {item.title}
                        </p>

                        <p className="mt-1 line-clamp-2 text-[9px] leading-[1.5] text-[#756d65] sm:text-[10px]">
                          {item.body}
                        </p>

                        <div className="mt-2 flex items-center gap-1 text-[8px] text-[#a39a91]">
                          <Clock3 size={10} />
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {!item.read && (
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e86b3e]" />
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-9 text-center">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f8f6f2] text-[#b5aaa0]">
                    <Bell size={19} strokeWidth={1.5} />
                  </div>

                  <p className="mt-3 text-[11px] font-semibold text-[#51483f]">
                    You’re all caught up
                  </p>

                  <p className="mt-1 text-[9px] text-[#999087]">
                    No notifications yet. We’ll keep you updated.
                  </p>
                </div>
              )}
            </div>

            {}
            {items.length > 0 && (
              <div className="flex shrink-0 items-center justify-between border-t border-[#f0ede8] bg-white px-3 py-2.5 sm:px-5">
                <p className="text-[9px] text-[#a09890]">
                  {items.length} notification{items.length === 1 ? '' : 's'}
                </p>

                <button
                  type="button"
                  onClick={() => void clearHistory()}
                  className="inline-flex items-center gap-1.5 text-[9px] font-medium text-[#a64e31] transition hover:text-red-600"
                >
                  <Trash2 size={11} />
                  Clear history
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
