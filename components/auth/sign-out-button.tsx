
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

export default function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const { refreshSession } = useAuth();

  async function signOut() {
    if (pending) return;

    setPending(true);

    try {
      const response = await fetch('/api/auth/sign-out', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Sign out failed');
      }

      await refreshSession();
      router.replace('/');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-[11px] font-medium text-[#c44c38] transition hover:bg-[#fff3ef] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <LoaderCircle size={15} className="animate-spin" />
      ) : (
        <LogOut size={15} />
      )}

      {pending ? 'Signing out...' : 'Sign out'}
    </button>
  );
}
