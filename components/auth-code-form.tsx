'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useCart } from '@/components/cart-provider';

type EmailCodeFormProps = { mode: 'verify' | 'reset'; email: string; returnTo: string };

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
      setMessage('If the address has an account awaiting verification, a new code is on its way.');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'We could not send another code.',
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-panel">
      <p className="eyebrow">
        <span /> ChunknChop ACCOUNT
      </p>
      <h1>
        {isVerify ? (
          <>
            Check your <em>inbox.</em>
          </>
        ) : (
          <>
            Set a new <em>password.</em>
          </>
        )}
      </h1>
      <p className="auth-description">
        {isVerify
          ? 'Enter the 8-digit code we sent to finish creating your account.'
          : 'Enter the 8-digit code from your email and choose a new password.'}
      </p>
      <form className="auth-form" onSubmit={submit}>
        <label>
          Email address
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          8-digit code
          <input
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{8}"
            maxLength={8}
            required
          />
        </label>
        {!isVerify && (
          <>
            <label>
              New password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={256}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={256}
                required
              />
            </label>
          </>
        )}
        <button className="admin-primary-button" type="submit" disabled={pending}>
          {pending ? (
            <LoaderCircle className="auth-spinner" size={16} />
          ) : isVerify ? (
            'VERIFY EMAIL'
          ) : (
            'RESET PASSWORD'
          )}
          <ArrowRight size={16} />
        </button>
      </form>
      {isVerify && (
        <button
          className="auth-text-button"
          type="button"
          onClick={resendCode}
          disabled={resending}
        >
          {resending ? 'Sending…' : 'Send another code'}
        </button>
      )}
      {error && (
        <p className="auth-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      {message && (
        <p className="auth-success" role="status" aria-live="polite">
          {message}
        </p>
      )}
      <p className="auth-switch">
        <Link href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}>Back to sign in</Link>
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
      if (!response.ok) throw new Error('We could not process that request. Please try again.');
      setSent(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'We could not process that request.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-panel">
      <p className="eyebrow">
        <span /> ChunknChop ACCOUNT
      </p>
      <h1>
        Find your <em>way back.</em>
      </h1>
      <p className="auth-description">
        Enter your email and we&apos;ll send a password reset code if an account matches.
      </p>
      {sent ? (
        <div className="auth-confirmation" role="status">
          <p>If an account matches that email, a reset code is on its way.</p>
          <Link
            className="auth-inline-link"
            href={`/reset-password?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`}
          >
            Enter your reset code
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button className="admin-primary-button" type="submit" disabled={pending}>
            {pending ? <LoaderCircle className="auth-spinner" size={16} /> : 'SEND RESET CODE'}
            <ArrowRight size={16} />
          </button>
        </form>
      )}
      {error && (
        <p className="auth-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      <p className="auth-switch">
        <Link href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}>Back to sign in</Link>
      </p>
    </div>
  );
}
