
'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useCart } from '@/components/cart/cart-provider';

type EmailCodeFormProps = { mode: 'verify' | 'reset'; email: string; returnTo: string };

function internalDestination(value: string) {
  try {
    const destination = new URL(value, window.location.origin);
    return destination.origin === window.location.origin
      ? `${destination.pathname}${destination.search}${destination.hash}`
      : '/account/orders';
  } catch {
    return '/account/orders';
  }
}

export function EmailCodeForm({ mode, email: initialEmail, returnTo }: EmailCodeFormProps) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const { syncGuestCart } = useCart();
  const [email, setEmail] = useState(initialEmail);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const isVerify = mode === 'verify';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    setMessage('');

    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmPassword') ?? '');

    if (!isVerify && password !== confirmation) {
      setError('Those passwords don’t match.');
      setPending(false);
      return;
    }

    try {
      const response = await fetch(
        isVerify ? '/api/auth/email/verify' : '/api/auth/password/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            code: String(form.get('code') ?? ''),
            ...(isVerify ? {} : { password }),
          }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) throw new Error(result?.error || 'We could not verify that code.');

      if (isVerify) {
        await refreshSession();
        await syncGuestCart();
        router.replace(internalDestination(returnTo));
        router.refresh();
      } else {
        setMessage('Your password has been reset. Sign in with your new password.');

        window.setTimeout(
          () =>
            router.replace(
              `/sign-in?reset=1&returnTo=${encodeURIComponent(internalDestination(returnTo))}`,
            ),
          900,
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'We could not complete that request.',
      );
    } finally {
      setPending(false);
    }
  }

  async function resendCode() {
    setResending(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/email/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) throw new Error(result?.error || 'We could not send another code.');

      setMessage(
        'If the address has an account awaiting verification, a new code is on its way.',
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'We could not send another code.',
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[460px] rounded-sm bg-white px-6 py-8 shadow-[0_8px_40px_rgba(36,35,31,0.05)] sm:px-10 sm:py-10">
      <p className="mb-5 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#88847d]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#e86b3e]" />
        ChunknChop ACCOUNT
      </p>

      <h1 className="font-heading text-4xl font-semibold leading-[1.1] tracking-[-0.04em] text-[#24231f] sm:text-[42px]">
        {isVerify ? (
          <>
            Check your <em className="font-normal text-[#e86b3e]">inbox.</em>
          </>
        ) : (
          <>
            Set a new <em className="font-normal text-[#e86b3e]">password.</em>
          </>
        )}
      </h1>

      <p className="mt-3 text-sm leading-6 text-[#77736d]">
        {isVerify
          ? 'Enter the 8-digit code we sent to finish creating your account.'
          : 'Enter the 8-digit code from your email and choose a new password.'}
      </p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={submit}>
        <label className="flex flex-col gap-2 text-xs font-semibold text-[#332925]">
          Email address
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full border border-[#e6e4de] bg-[#fcfcfa] px-4 text-sm text-[#24231f] outline-none transition-colors focus:border-[#e86b3e]"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs font-semibold text-[#332925]">
          8-digit code
          <input
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{8}"
            maxLength={8}
            required
            className="h-12 w-full border border-[#e6e4de] bg-[#fcfcfa] px-4 text-sm tracking-[0.2em] text-[#24231f] outline-none transition-colors focus:border-[#e86b3e]"
          />
        </label>

        {!isVerify && (
          <>
            <label className="flex flex-col gap-2 text-xs font-semibold text-[#332925]">
              New password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={256}
                required
                className="h-12 w-full border border-[#e6e4de] bg-[#fcfcfa] px-4 text-sm text-[#24231f] outline-none transition-colors focus:border-[#e86b3e]"
              />
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold text-[#332925]">
              Confirm new password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={256}
                required
                className="h-12 w-full border border-[#e6e4de] bg-[#fcfcfa] px-4 text-sm text-[#24231f] outline-none transition-colors focus:border-[#e86b3e]"
              />
            </label>
          </>
        )}

        <button
          className="mt-1 flex h-12 w-full items-center justify-between bg-[#e86b3e] px-5 text-[10px] font-bold tracking-[0.14em] text-white transition-colors hover:bg-[#a9442c] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          <span>
            {pending ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="animate-spin" size={16} />
                PLEASE WAIT
              </span>
            ) : isVerify ? (
              'VERIFY EMAIL'
            ) : (
              'RESET PASSWORD'
            )}
          </span>
          <ArrowRight size={16} />
        </button>
      </form>

      {isVerify && (
        <button
          className="mt-6 text-xs font-semibold text-[#e86b3e] transition-colors hover:text-[#a9442c] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={resendCode}
          disabled={resending}
        >
          {resending ? 'Sending…' : 'Send another code'}
        </button>
      )}

      {error && (
        <p
          className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          className="mt-5 border border-green-200 bg-green-50 px-4 py-3 text-xs leading-5 text-green-700"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      )}

      <p className="mt-8 border-t border-[#e6e4de] pt-6 text-center text-xs text-[#77736d]">
        <Link
          className="font-semibold text-[#e86b3e] transition-colors hover:text-[#a9442c]"
          href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm({ returnTo }: { returnTo: string }) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('We could not process that request. Please try again.');
      }

      setSent(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'We could not process that request.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[460px] rounded-sm bg-white px-6 py-8 shadow-[0_8px_40px_rgba(36,35,31,0.05)] sm:px-10 sm:py-10">
      <p className="mb-5 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#88847d]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#e86b3e]" />
        ChunknChop ACCOUNT
      </p>

      <h1 className="font-heading text-4xl font-semibold leading-[1.1] tracking-[-0.04em] text-[#24231f] sm:text-[42px]">
        Find your <em className="font-normal text-[#e86b3e]">way back.</em>
      </h1>

      <p className="mt-3 text-sm leading-6 text-[#77736d]">
        Enter your email and we&apos;ll send a password reset code if an account matches.
      </p>

      {sent ? (
        <div className="mt-8 border border-[#e6e4de] bg-[#fcfcfa] p-5" role="status">
          <p className="text-sm leading-6 text-[#77736d]">
            If an account matches that email, a reset code is on its way.
          </p>

          <Link
            className="mt-4 inline-block text-xs font-semibold text-[#e86b3e] underline underline-offset-4 transition-colors hover:text-[#a9442c]"
            href={`/reset-password?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`}
          >
            Enter your reset code
          </Link>
        </div>
      ) : (
        <form className="mt-8 flex flex-col gap-5" onSubmit={submit}>
          <label className="flex flex-col gap-2 text-xs font-semibold text-[#332925]">
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 w-full border border-[#e6e4de] bg-[#fcfcfa] px-4 text-sm text-[#24231f] outline-none transition-colors focus:border-[#e86b3e]"
            />
          </label>

          <button
            className="mt-1 flex h-12 w-full items-center justify-between bg-[#e86b3e] px-5 text-[10px] font-bold tracking-[0.14em] text-white transition-colors hover:bg-[#a9442c] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            <span>
              {pending ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="animate-spin" size={16} />
                  PLEASE WAIT
                </span>
              ) : (
                'SEND RESET CODE'
              )}
            </span>
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {error && (
        <p
          className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}

      <p className="mt-8 border-t border-[#e6e4de] pt-6 text-center text-xs text-[#77736d]">
        <Link
          className="font-semibold text-[#e86b3e] transition-colors hover:text-[#a9442c]"
          href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
