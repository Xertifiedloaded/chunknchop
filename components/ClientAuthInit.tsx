'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { isProtectedPage } from '@/lib/auth-routes';
import { hydrateSession, useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';

export default function ClientAuthInit() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    hydrateSession();

    function revalidate() {
      if (document.visibilityState === 'visible') hydrateSession();
    }

    document.addEventListener('visibilitychange', revalidate);
    return () => document.removeEventListener('visibilitychange', revalidate);
  }, []);

  useEffect(() => {
    if (!isHydrated || user) return;
    const { items, setItems } = useCartStore.getState();
    if (items.length > 0) setItems([]);
  }, [isHydrated, user]);

  useEffect(() => {
    if (isHydrated && !user && isProtectedPage(pathname)) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, user, pathname, router]);

  return null;
}