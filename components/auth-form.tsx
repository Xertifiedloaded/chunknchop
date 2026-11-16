'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useCart } from '@/components/cart-provider';

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
      : '/account';
  } catch {
    return '/account';
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

      const destination = internalDestination(returnTo);
      if (isSignUp) {
        const verifyUrl = new URL('/verify-email', window.location.origin);
        verifyUrl.searchParams.set('email', email);
        verifyUrl.searchParams.set('returnTo', destination);
        router.push(`${verifyUrl.pathname}${verifyUrl.search}`);
      } else {
        await refreshSession();
        await syncGuestCart();
        router.replace(
          destination.startsWith('/') && !destination.startsWith('//') ? destination : '/account',
        );
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
    window.location.assign(`/api/auth/google/start?returnTo=${encodeURIComponent(destination)}`);
  }

  return (
    <div className="auth-panel">
      <p className="eyebrow">
        <span /> ChunknChop ACCOUNT
      </p>
      <h1>
        {isSignUp ? (
          <>
            Join the <em>table.</em>
          </>
        ) : (
          <>
            Welcome <em>back.</em>
          </>
        )}
      </h1>
      <p className="auth-description">
        {isSignUp
          ? 'Create an account to keep your details close.'
          : 'Sign in to continue to your account.'}
      </p>
      <form className="auth-form" onSubmit={submit}>
        {isSignUp && (
          <label>
            Name
            <input name="name" type="text" autoComplete="name" required maxLength={80} />
          </label>
        )}
        <label>
          Email address
          <input name="email" type="email" autoComplete="email" required maxLength={254} />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={isSignUp ? 12 : 1}
            maxLength={256}
            required
          />
        </label>
        {isSignUp && <p className="auth-hint">Use at least 12 characters.</p>}
        {!isSignUp && (
          <Link
            className="auth-inline-link"
            href={`/forgot-password?returnTo=${encodeURIComponent(returnTo)}`}
          >
            Forgot your password?
          </Link>
        )}
        <button className="admin-primary-button" type="submit" disabled={pending}>
          {pending ? (
            <LoaderCircle className="auth-spinner" size={16} />
          ) : isSignUp ? (
            'CREATE ACCOUNT'
          ) : (
            'SIGN IN'
          )}
          <ArrowRight size={16} />
        </button>
      </form>
      {googleEnabled ? (
        <>
          <div className="auth-divider">
            <span>OR</span>
          </div>
          <button
            type="button"
            className="auth-google-button"
            onClick={continueWithGoogle}
            disabled={pending}
          >
            Continue with Google
          </button>
        </>
      ) : (
        <p className="auth-provider-note">Google sign-in is not configured in this environment.</p>
      )}
      {googleError && (
        <p className="auth-error" role="alert">
          Google sign-in could not be completed. Try again or use your email.
        </p>
      )}
      {passwordReset && (
        <p className="auth-success" role="status">
          Your password has been reset. Sign in with your new password.
        </p>
      )}
      {error && (
        <p className="auth-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      {unverifiedEmail && (
        <p className="auth-hint">
          Need a fresh code?{' '}
          <Link
            className="auth-inline-link"
            href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}&returnTo=${encodeURIComponent(returnTo)}`}
          >
            Verify your email
          </Link>
        </p>
      )}
      <p className="auth-switch">
        {isSignUp ? 'Already have an account?' : 'New to ChunknChop?'}{' '}
        <Link
          href={`${isSignUp ? '/sign-in' : '/sign-up'}?returnTo=${encodeURIComponent(returnTo)}`}
        >
          {isSignUp ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </div>
  );
}
