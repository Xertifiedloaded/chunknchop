'use client';

import { useEffect } from 'react';
import { hydrateSession } from '@/lib/store/authStore';

export default function ClientAuthInit() {
  useEffect(() => {
    hydrateSession().catch(() => null);
  }, []);

  return null;
}
