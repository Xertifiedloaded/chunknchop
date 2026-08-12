'use client';

import { useEffect } from 'react';
import { restoreSession } from '@/lib/store/authStore';

export default function ClientAuthInit() {
  useEffect(() => {
    restoreSession().catch(() => null);
  }, []);

  return null;
}
