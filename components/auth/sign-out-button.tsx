
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';

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
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 border border-[#e7e5df] bg-transparent px-4 py-2 text-[11px] font-semibold tracking-[0.08em] text-[#514f49] transition-colors duration-200 hover:border-[#e86b3e] hover:text-[#e86b3e] disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      onClick={signOut}
      disabled={pending}
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
