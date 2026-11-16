'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export default function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const { refreshSession } = useAuth();

  async function signOut() {
    setPending(true);
    try {
      const response = await fetch('/api/auth/sign-out', { method: 'POST' });
      if (!response.ok) throw new Error('Sign out failed');
      await refreshSession();
      router.replace('/');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button className="admin-secondary-button" type="button" onClick={signOut} disabled={pending}>
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
