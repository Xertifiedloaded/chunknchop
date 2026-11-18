'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useCart } from '@/components/cart/cart-provider';

export function InvitationForm({ email: initialEmail }: { email: string }) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const { syncGuestCart } = useCart();

  const [email, setEmail] = useState(initialEmail);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    setSuccess('');

    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const code = String(form.get('code') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmPassword') ?? '');

    if (password !== confirmation) {
      setError('Your passwords do not match.');
      setPending(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, code, password }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'We could not complete your invitation.');
      }

      setSuccess('Your account has been created successfully.');

      await refreshSession();
      await syncGuestCart();

      router.replace('/');
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'We could not complete your invitation.',
      );
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    'h-10 w-full min-w-0 rounded-sm border border-[#e8e5df] bg-[#fdfcfb] px-3.5 text-[13px] font-normal text-[#292722] outline-none transition-colors placeholder:text-[#aaa69f] hover:border-[#d5cfc6] focus:border-[#e86b3e] focus:ring-2 focus:ring-[#e86b3e]/10';

  const labelClass =
    'flex min-w-0 flex-col gap-1.5 text-[11px] font-semibold tracking-[0.01em] text-[#49443e]';

  return (
    <div className="mx-auto w-full max-w-[430px] px-3 py-5 sm:px-0 sm:py-8">
      <div className="rounded-sm border border-[#efede8] bg-white px-5 py-7 shadow-[0_8px_35px_rgba(36,35,31,0.045)] sm:px-8 sm:py-8">
        <div className="mb-5 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#e86b3e]" />
          <p className="text-[9px] font-bold tracking-[0.17em] text-[#89847d]">
            CHUNKNCHOP ACCOUNT
          </p>
        </div>

        <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-[#fff3ed] text-[#e86b3e]">
          <ShieldCheck size={19} strokeWidth={1.8} />
        </div>

        <h1 className="font-heading text-[25px] font-semibold leading-[1.2] tracking-[-0.045em] text-[#24231f] sm:text-[28px]">
          Complete your <em className="font-normal text-[#e86b3e]">invitation.</em>
        </h1>

        <p className="mt-2.5 max-w-[330px] text-[12px] leading-[1.7] text-[#817c74]">
          Verify your email and create a password to activate your account.
        </p>

        <form className="mt-6 flex flex-col gap-3.5" onSubmit={submit}>
          <label className={labelClass}>
            Email address
            <input
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Your full name
            <input
              name="name"
              type="text"
              autoComplete="name"
              maxLength={80}
              required
              placeholder="Enter your full name"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Invitation code
            <input
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{8}"
              maxLength={8}
              required
              placeholder="Enter your 8-digit code"
              className={`${inputClass} tracking-[0.18em]`}
            />
            <span className="text-[10px] font-normal text-[#a09a91]">
              Check your email for your invitation code.
            </span>
          </label>

          <label className={labelClass}>
            Create password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={256}
              required
              placeholder="At least 12 characters"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={256}
              required
              placeholder="Enter your password again"
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="mt-1 flex h-11 w-full items-center justify-between rounded-sm bg-[#e86b3e] px-4 text-[10px] font-bold tracking-[0.12em] text-white transition-colors duration-200 hover:bg-[#c65330] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e86b3e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex items-center gap-2">
              {pending && <LoaderCircle size={14} className="animate-spin" />}
              {pending ? 'SETTING UP ACCOUNT' : 'VERIFY AND CREATE ACCOUNT'}
            </span>
            {!pending && <ArrowRight size={15} />}
          </button>
        </form>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-red-100 bg-red-50 px-3.5 py-3 text-[11px] leading-5 text-red-700"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="mt-4 rounded-sm border border-green-100 bg-green-50 px-3.5 py-3 text-[11px] leading-5 text-green-700"
          >
            {success}
          </p>
        )}

        <p className="mt-6 border-t border-[#f0eee9] pt-4 text-center text-[10px] leading-5 text-[#a09a91]">
          Secure account activation · ChunknChop
        </p>
      </div>
    </div>
  );
}
