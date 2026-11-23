'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function decodeVapidKey(value: string) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

export default function StorefrontPwaPrompt() {
  const pathname = usePathname();
  const [browserReady, setBrowserReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setBrowserReady(true);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setInstalled(isStandalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setDismissed(localStorage.getItem('chunknchop-pwa-dismissed') === '1');
    if ('Notification' in window) setPermission(Notification.permission);

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setMessage('ChunkNChop is installed.');
    };
    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    const checkSub = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      try {
        const registration = await navigator.serviceWorker.ready;
        const current = await registration.pushManager.getSubscription();
        setSubscribed(Boolean(current));
        if (current) {
          const anonymousId = localStorage.getItem('chunknchop-anonymous-push-id') || crypto.randomUUID();
          localStorage.setItem('chunknchop-anonymous-push-id', anonymousId);
          // Re-associate this device's subscription with the signed-in account on storefront visits.
          void fetch('/api/notifications/subscribe', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ subscription: current, anonymousId }),
          }).catch(() => undefined);
        }
      } catch {}
    };
    void checkSub();
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);


  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setMessage(choice.outcome === 'accepted' ? 'Installation was accepted.' : 'Install prompt dismissed.');
    setInstallPrompt(null);
  }

  async function enablePush() {
    if (!browserReady || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setMessage('Notifications are not supported in this browser.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== 'granted') {
        setMessage(permissionResult === 'denied' ? 'Notifications are blocked in browser settings.' : 'Notification permission was not granted.');
        return;
      }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) throw new Error('Push notification keys are not configured.');
      const registration = await navigator.serviceWorker.register('/sw.js');
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(key) });
      }
      const anonymousId = localStorage.getItem('chunknchop-anonymous-push-id') || crypto.randomUUID();
      localStorage.setItem('chunknchop-anonymous-push-id', anonymousId);
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subscription, anonymousId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not save push subscription.');
      setSubscribed(true);
      setMessage('Notifications are enabled. Order updates can reach this device.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not enable notifications.');
    } finally {
      setBusy(false);
    }
  }


  function closePrompt() {
    localStorage.setItem('chunknchop-pwa-dismissed', '1');
    setDismissed(true);
  }

  if (!browserReady || pathname !== '/' || dismissed) return null;
  const showInstall = !installed && (Boolean(installPrompt) || ios);
  const showNotifications = 'Notification' in window && 'PushManager' in window && permission !== 'granted' && !subscribed;
  if (!showInstall && !showNotifications && !message) return null;

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 py-3 sm:px-8 lg:px-12" aria-label="ChunkNChop app features">
      <div className="relative overflow-hidden rounded-xl border border-[#ead9c8] bg-[#fbf4ec] p-4 sm:p-5">
        <button type="button" onClick={closePrompt} aria-label="Dismiss app prompt" className="absolute right-3 top-3 rounded-full px-2 py-1 text-lg text-[#84776b] hover:bg-white">×</button>
        <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-bold text-[#302a24]">Get ChunkNChop on your home screen</p>
            <p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#80766d]">Install the app for quick access and enable notifications. Order-specific push updates are linked to your account after sign-in.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {showInstall && installPrompt && <button type="button" onClick={() => void install()} className="rounded-lg bg-[#29231f] px-4 py-2.5 text-[10px] font-bold text-white">Install app</button>}
            {showInstall && ios && !installPrompt && <span className="rounded-lg bg-white px-3 py-2.5 text-[10px] font-semibold text-[#62594f]">iPhone: Share → Add to Home Screen</span>}
            {showNotifications && <button type="button" disabled={busy} onClick={() => void enablePush()} className="rounded-lg border border-[#d9bda1] bg-white px-4 py-2.5 text-[10px] font-bold text-[#725133] disabled:opacity-60">{busy ? 'Enabling…' : 'Enable notifications'}</button>}
          </div>
        </div>
        {message && <p role="status" className="mt-2 text-[10px] font-semibold text-[#63584c]">{message}</p>}
      </div>
    </section>
  );
}
