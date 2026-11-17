'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { useCart } from '@/components/cart/cart-provider';
import { destinationForRole } from '@/lib/role-redirect';

type AuthFormProps = {
  mode: 'sign-in' | 'sign-up';
  returnTo: string;
  googleEnabled: boolean;
  googleError?: boolean;
  passwordReset?: boolean;
};

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

export default function AuthForm({
  mode,
  returnTo,
  googleEnabled,
  googleError = false,
  passwordReset = false,
}: AuthFormProps) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const { syncGuestCart } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const isSignUp = mode === 'sign-up';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError('');
    setUnverifiedEmail('');

    try {
      const email = String(form.get('email') ?? '')
        .trim()
        .toLowerCase();

      const response = await fetch(`/api/auth/${isSignUp ? 'sign-up' : 'sign-in'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: String(form.get('password') ?? ''),
          ...(isSignUp ? { name: String(form.get('name') ?? '').trim() } : {}),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          result?.error || 'We couldn’t complete that request. Check your details and try again.',
        );

        if (response.status === 403 && !isSignUp) setUnverifiedEmail(email);
        return;
      }

      if (isSignUp) {
        const destination = internalDestination(returnTo);
        const verifyUrl = new URL('/verify-email', window.location.origin);
        verifyUrl.searchParams.set('email', email);
        verifyUrl.searchParams.set('returnTo', destination);
        router.push(`${verifyUrl.pathname}${verifyUrl.search}`);
      } else {
        const session = await refreshSession();
        await syncGuestCart();

        router.replace(destinationForRole(session?.user?.role));
        router.refresh();
      }
    } catch {
      setError('We couldn’t complete that request. Check your details and try again.');
    } finally {
      setPending(false);
    }
  }

  function continueWithGoogle() {
    const destination = internalDestination(returnTo);
    window.location.assign(
      `/api/auth/google/start?returnTo=${encodeURIComponent(destination)}`,
    );
  }

  return (
    <div className="mx-auto w-full max-w-[460px] rounded-sm bg-white px-6 py-8 shadow-[0_8px_40px_rgba(36,35,31,0.05)] sm:px-10 sm:py-10">
      <p className="mb-5 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#88847d]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#e86b3e]" />
        ChunknChop ACCOUNT
      </p>

      <h1 className="font-heading text-4xl font-semibold leading-[1.1] tracking-[-0.04em] text-[#24231f] sm:text-[42px]">
        {isSignUp ? (
          <>
            Join the <em className="font-normal text-[#e86b3e]">table.</em>
          </>
        ) : (
          <>
            Welcome <em className="font-normal text-[#e86b3e]">back.</em>
          </>
        )}
      </h1>

      <p className="mt-3 text-sm leading-6 text-[#77736d]">
        {isSignUp
          ? 'Create an account to keep your details close.'
          : 'Sign in to continue to your account.'}
      </p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={submit}>
        {isSignUp && (
          <label className="flex flex-col gap-2 text-xs font-semibold text-[#332925]">
            Name
            <input
              name="name"
              type="text"
              autoComplete="name"
              required
              maxLength={80}
              className="h-12 w-full border border-[#e6e4de] bg-[#fcfcfa] px-4 text-sm text-[#24231f] outline-none transition-colors placeholder:text-[#aaa69e] focus:border-[#e86b3e]"
            />
          </label>
        )}

        <label className="flex flex-col gap-2 text-xs font-semibold text-[#332925]">
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className="h-12 w-full border border-[#e6e4de] bg-[#fcfcfa] px-4 text-sm text-[#24231f] outline-none transition-colors placeholder:text-[#aaa69e] focus:border-[#e86b3e]"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs font-semibold text-[#332925]">
          Password
          <input
            name="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={isSignUp ? 12 : 1}
            maxLength={256}
            required
            className="h-12 w-full border border-[#e6e4de] bg-[#fcfcfa] px-4 text-sm text-[#24231f] outline-none transition-colors placeholder:text-[#aaa69e] focus:border-[#e86b3e]"
          />
        </label>

        {isSignUp && (
          <p className="-mt-2 text-xs leading-5 text-[#88847d]">
            Use at least 12 characters.
          </p>
        )}

        {!isSignUp && (
          <Link
            className="self-end text-xs font-medium text-[#77736d] transition-colors hover:text-[#e86b3e]"
            href={`/forgot-password?returnTo=${encodeURIComponent(returnTo)}`}
          >
            Forgot your password?
          </Link>
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
            ) : isSignUp ? (
              'CREATE ACCOUNT'
            ) : (
              'SIGN IN'
            )}
          </span>
          <ArrowRight size={16} />
        </button>
      </form>

      {googleEnabled ? (
        <>
          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-[#e6e4de]" />
            <span className="text-[10px] font-semibold tracking-[0.12em] text-[#aaa69e]">
              OR
            </span>
            <span className="h-px flex-1 bg-[#e6e4de]" />
          </div>

          <button
            type="button"
            className="flex h-12 w-full items-center justify-center border border-[#e6e4de] bg-white text-xs font-semibold text-[#332925] transition-colors hover:border-[#24231f] hover:bg-[#fcfcfa] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={continueWithGoogle}
            disabled={pending}
          >
            Continue with Google
          </button>
        </>
      ) : (
        <p className="mt-6 text-center text-xs leading-5 text-[#88847d]">
          Google sign-in is not configured in this environment.
        </p>
      )}

      {googleError && (
        <p
          className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700"
          role="alert"
        >
          Google sign-in could not be completed. Try again or use your email.
        </p>
      )}

      {passwordReset && (
        <p
          className="mt-5 border border-green-200 bg-green-50 px-4 py-3 text-xs leading-5 text-green-700"
          role="status"
        >
          Your password has been reset. Sign in with your new password.
        </p>
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

      {unverifiedEmail && (
        <p className="mt-5 text-xs leading-5 text-[#77736d]">
          Need a fresh code?{' '}
          <Link
            className="font-semibold text-[#e86b3e] underline underline-offset-4 hover:text-[#a9442c]"
            href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}&returnTo=${encodeURIComponent(returnTo)}`}
          >
            Verify your email
          </Link>
        </p>
      )}

      <p className="mt-8 border-t border-[#e6e4de] pt-6 text-center text-xs text-[#77736d]">
        {isSignUp ? 'Already have an account?' : 'New to ChunknChop?'}{' '}
        <Link
          className="font-semibold text-[#e86b3e] transition-colors hover:text-[#a9442c]"
          href={`${isSignUp ? '/sign-in' : '/sign-up'}?returnTo=${encodeURIComponent(returnTo)}`}
        >
          {isSignUp ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </div>
  );
}