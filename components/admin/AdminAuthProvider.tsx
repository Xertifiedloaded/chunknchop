'use client';

import React, { useEffect } from 'react';
import { useAuthStore, hydrateSession } from '@/lib/store/authStore';

export default function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      hydrateSession();
    }
  }, [isHydrated]);

  return <>{children}</>;
}
