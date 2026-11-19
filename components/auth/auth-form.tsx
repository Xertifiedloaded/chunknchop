'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
  LoaderCircle,
  Pencil,
  Check,
  X,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

import { useAuth } from '@/components/auth/auth-provider';
import { useCart } from '@/components/cart/cart-provider';
import { destinationForRole } from '@/lib/role-redirect';

type AuthMode = 'sign-in' | 'sign-up' | 'verify' | 'reset' | 'forgot-password';

type AuthFormProps = {
  mode: AuthMode;
  returnTo: string;
  googleEnabled?: boolean;
  googleError?: boolean;
  passwordReset?: boolean;
  email?: string;
};

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  code?: string;
};

type InputProps = {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  icon?: ReactNode;
  required?: boolean;
  passwordToggle?: boolean;
  value?: string;
  error?: string;
  onChange?: (value: string) => void;
  inputMode?: 'text' | 'numeric' | 'email' | 'tel' | 'search';
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

function AuthInput({
  label,
  name,
  type = 'text',
  placeholder,
  autoComplete,
  minLength,
  maxLength,
  icon,
  required = true,
  passwordToggle = false,
  value,
  error,
  onChange,
  inputMode,
}: InputProps) {
  const [visible, setVisible] = useState(false);

  const inputType = passwordToggle ? (visible ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-[11px] font-semibold text-[#303647]">
        {label}
        {required && <span className="ml-0.5 text-brand">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <span
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
              error ? 'text-red-400' : 'text-[#a1a8b6]'
            }`}
          >
            {icon}
          </span>
        )}

        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          required={required}
          value={value}
          inputMode={inputMode}
          onChange={(event) => onChange?.(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`h-11 w-full rounded-xl border bg-white ${
            icon ? 'pl-10' : 'pl-3.5'
          } pr-10 text-[12px] text-[#252a38] outline-none transition-all placeholder:text-[#a1a8b6]
            ${
              error
                ? 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-[#e8eaf0] hover:border-[#d5d8e1] focus:border-brand focus:ring-2 focus:ring-brand/10'
            }`}
        />

        {passwordToggle && (
          <button
            type="button"
            onClick={() => setVisible((previous) => !previous)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9aa3b2] transition hover:text-brand"
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>

      {error && (
        <p
          id={`${name}-error`}
          className="flex items-center gap-1 text-[10px] font-medium text-red-600"
          role="alert"
        >
          <X size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

function getPasswordStrength(password: string) {
  if (!password) {
    return {
      score: 0,
      label: '',
      color: 'bg-gray-200',
      textColor: 'text-gray-400',
    };
  }

  const checks = [
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];

  const score = checks.filter(Boolean).length;

  const levels = [
    { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600' },
    { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600' },
    { label: 'Fair', color: 'bg-orange-400', textColor: 'text-orange-600' },
    { label: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  ];

  return {
    score,
    ...levels[score],
  };
}

function PasswordStrength({ password }: { password: string }) {
  const strength = getPasswordStrength(password);

  const requirements = [
    {
      label: 'At least 12 characters',
      valid: password.length >= 12,
    },
    {
      label: 'Uppercase and lowercase',
      valid: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
      label: 'At least one number',
      valid: /\d/.test(password),
    },
    {
      label: 'At least one special character',
      valid: /[^a-zA-Z0-9]/.test(password),
    },
  ];

  return (
    <div className="space-y-2.5 rounded-xl border border-[#eceef2] bg-[#fafbfc] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#596174]">Password strength</span>

        <span className={`text-[10px] font-bold ${strength.textColor}`}>
          {strength.label || 'Not entered'}
        </span>
      </div>

      <div className="flex gap-1">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              item <= strength.score ? strength.color : 'bg-[#e6e8ed]'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-2">
        {requirements.map((requirement) => (
          <div
            key={requirement.label}
            className={`flex items-center gap-1.5 text-[9px] ${
              requirement.valid ? 'text-emerald-600' : 'text-[#969dab]'
            }`}
          >
            {requirement.valid ? (
              <Check size={11} />
            ) : (
              <span className="h-1 w-1 rounded-full bg-current" />
            )}

            {requirement.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function FormMessage({ message, type = 'error' }: { message: string; type?: 'error' | 'success' }) {
  if (!message) return null;

  return (
    <p
      className={`rounded-xl border px-3 py-2.5 text-[10px] leading-5 ${
        type === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {message}
    </p>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.8 6.1-14.9Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.1C9.2 39.4 16 44 24 44Z"
      />
      <path fill="#1976D2" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.1H5.8a20 20 0 0 0 0 17.4l6.8-5.1Z" />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 5.9 29.5 4 24 4 16 4 9.2 8.6 5.8 15.3l6.8 5.1C14.2 15.6 18.7 12 24 12Z"
      />
    </svg>
  );
}

function SignInSignUpForm({
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [password, setPassword] = useState('');

  const isSignUp = mode === 'sign-up';

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));

    setError('');
  }

  function validateForm(form: FormData) {
    const errors: FieldErrors = {};

    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const currentPassword = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmPassword') ?? '');

    if (isSignUp && !name) {
      errors.name = 'Please enter your full name.';
    }

    if (isSignUp && name.length > 80) {
      errors.name = 'Name cannot exceed 80 characters.';
    }

    if (!email) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!currentPassword) {
      errors.password = 'Password is required.';
    } else if (isSignUp && currentPassword.length < 12) {
      errors.password = 'Password must contain at least 12 characters.';
    }

    if (isSignUp && currentPassword !== confirmation) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const validationErrors = validateForm(form);

    setFieldErrors(validationErrors);
    setError('');

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const email = String(form.get('email') ?? '')
      .trim()
      .toLowerCase();

    const currentPassword = String(form.get('password') ?? '');

    setPending(true);
    setUnverifiedEmail('');

    try {
      const response = await fetch(`/api/auth/${isSignUp ? 'sign-up' : 'sign-in'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: currentPassword,
          ...(isSignUp
            ? {
                name: String(form.get('name') ?? '').trim(),
              }
            : {}),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          result?.error || 'We couldn’t complete that request. Check your details and try again.',
        );

        if (response.status === 403 && !isSignUp) {
          setUnverifiedEmail(email);
        }

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

    window.location.assign(`/api/auth/google/start?returnTo=${encodeURIComponent(destination)}`);
  }

  return (
    <div className="mx-auto w-full max-w-97.5 py-2">
      <div className="mb-6 text-center">
        <h1 className="mt-4 text-[23px] font-extrabold leading-tight tracking-tight text-[#202331]">
          {isSignUp ? 'Create Your Account' : 'Welcome Back'}
        </h1>

        <p className="mt-1.5 text-[11px] text-[#858b9a]">
          {isSignUp
            ? 'Join ChunkNChop and start shopping today.'
            : 'Sign in to your ChunkNChop account.'}
        </p>
      </div>

      {passwordReset && (
        <div className="mb-4">
          <FormMessage
            message="Your password has been reset. Sign in with your new password."
            type="success"
          />
        </div>
      )}

      <form onSubmit={submit} noValidate className="space-y-3">
        {isSignUp && (
          <AuthInput
            label="Full Name"
            name="name"
            placeholder="Enter your full name"
            autoComplete="name"
            maxLength={80}
            icon={<User size={14} />}
            error={fieldErrors.name}
            onChange={() => clearFieldError('name')}
          />
        )}

        <AuthInput
          label="Email Address"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          maxLength={254}
          icon={<Mail size={14} />}
          error={fieldErrors.email}
          onChange={() => clearFieldError('email')}
        />

        <div className="space-y-2">
          <AuthInput
            label="Password"
            name="password"
            type="password"
            placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={isSignUp ? 12 : 1}
            maxLength={256}
            icon={<LockKeyhole size={14} />}
            passwordToggle
            error={fieldErrors.password}
            onChange={(value) => {
              setPassword(value);
              clearFieldError('password');
            }}
          />

          {isSignUp && <PasswordStrength password={password} />}

          {!isSignUp && (
            <div className="flex justify-end">
              <Link
                href={`/forgot-password?returnTo=${encodeURIComponent(returnTo)}`}
                className="text-[10px] font-semibold text-brand transition hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </div>

        {isSignUp && (
          <AuthInput
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            minLength={12}
            maxLength={256}
            icon={<ShieldCheck size={14} />}
            passwordToggle
            error={fieldErrors.confirmPassword}
            onChange={(value) => {
              clearFieldError('confirmPassword');

              if (value && value !== password) {
                setFieldErrors((previous) => ({
                  ...previous,
                  confirmPassword: 'Passwords do not match.',
                }));
              }
            }}
          />
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[11px] font-bold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#df6035] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <>
              <LoaderCircle size={14} className="animate-spin" />
              PLEASE WAIT
            </>
          ) : (
            <>
              {isSignUp ? 'Create Account' : 'Sign In'}
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#eceef2]" />
            <span className="text-[9px] font-semibold tracking-wider text-[#9299a8]">
              OR CONTINUE WITH
            </span>
            <span className="h-px flex-1 bg-[#eceef2]" />
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={continueWithGoogle}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e9eaf0] bg-white text-[11px] font-semibold text-[#252a38] transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </>
      )}

      {!googleEnabled && (
        <p className="mt-4 text-center text-[10px] text-[#858b9a]">
          Google sign-in is not configured in this environment.
        </p>
      )}

      {googleError && (
        <div className="mt-4">
          <FormMessage message="Google sign-in could not be completed. Try again or use your email." />
        </div>
      )}

      {error && (
        <div className="mt-4">
          <FormMessage message={error} />
        </div>
      )}

      {unverifiedEmail && (
        <p className="mt-3 text-center text-[10px] text-[#777f90]">
          Need a fresh code?{' '}
          <Link
            className="font-semibold text-brand hover:underline"
            href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}&returnTo=${encodeURIComponent(returnTo)}`}
          >
            Verify your email
          </Link>
        </p>
      )}

      <div className="mt-5 border-t border-[#eceef2] pt-4">
        <p className="text-center text-[10px] text-[#777f90]">
          {isSignUp ? 'Already have an account?' : 'New to ChunkNChop?'}{' '}
          <Link
            className="font-bold text-brand transition hover:underline"
            href={`${isSignUp ? '/sign-in' : '/sign-up'}?returnTo=${encodeURIComponent(returnTo)}`}
          >
            {isSignUp ? 'Sign In' : 'Create Account'}
          </Link>
        </p>
      </div>
    </div>
  );
}

function EmailCodeForm({
  mode,
  email: initialEmail,
  returnTo,
}: {
  mode: 'verify' | 'reset';
  email: string;
  returnTo: string;
}) {
  const router = useRouter();

  const { refreshSession } = useAuth();
  const { syncGuestCart } = useCart();

  const [email, setEmail] = useState(initialEmail);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [password, setPassword] = useState('');

  const isVerify = mode === 'verify';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPending(true);
    setError('');
    setMessage('');
    setFieldErrors({});

    const form = new FormData(event.currentTarget);

    const code = String(form.get('code') ?? '').trim();
    const currentPassword = String(form.get('password') ?? '');
    const confirmation = String(form.get('confirmPassword') ?? '');

    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!/^\d{8}$/.test(code)) {
      errors.code = 'Enter the complete 8-digit code.';
    }

    if (!isVerify) {
      if (currentPassword.length < 12) {
        errors.password = 'Password must contain at least 12 characters.';
      }

      if (currentPassword !== confirmation) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
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
            email: email.trim().toLowerCase(),
            code,
            ...(isVerify ? {} : { password: currentPassword }),
          }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'We could not verify that code. Please try again.');
      }

      if (isVerify) {
        await refreshSession();
        await syncGuestCart();

        router.replace(internalDestination(returnTo));
        router.refresh();
      } else {
        setMessage('Your password has been reset. Redirecting to sign in...');

        window.setTimeout(() => {
          router.replace(
            `/sign-in?reset=1&returnTo=${encodeURIComponent(internalDestination(returnTo))}`,
          );
        }, 900);
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
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || 'We could not send another code.');
      }

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
    <div className="mx-auto w-full max-w-97.5 rounded-2xl border border-[#eceef2] bg-white px-6 py-7 shadow-[0_12px_45px_rgba(36,35,31,0.06)] sm:px-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1eb] text-brand">
          {isVerify ? <Mail size={21} /> : <KeyRound size={21} />}
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#202331]">
          {isVerify ? 'Verify your email' : 'Reset your password'}
        </h1>

        <p className="mt-2 text-[11px] leading-5 text-[#858b9a]">
          {isVerify
            ? 'Enter the 8-digit code we sent to your email to finish creating your account.'
            : 'Enter the 8-digit code from your email and choose a new password.'}
        </p>
      </div>

      <form className="space-y-4" onSubmit={submit} noValidate>
        <AuthInput
          label="Email Address"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          maxLength={254}
          icon={<Mail size={14} />}
          value={email}
          error={fieldErrors.email}
          onChange={(value) => {
            setEmail(value);
            setFieldErrors((previous) => ({
              ...previous,
              email: undefined,
            }));
          }}
        />

        <AuthInput
          label="8-Digit Verification Code"
          name="code"
          placeholder="Enter your 8-digit code"
          autoComplete="one-time-code"
          maxLength={8}
          icon={<ShieldCheck size={14} />}
          inputMode="numeric"
          error={fieldErrors.code}
          onChange={(value) => {
            const digits = value.replace(/\D/g, '').slice(0, 8);

            const input = document.getElementById('code') as HTMLInputElement | null;

            if (input) {
              input.value = digits;
            }

            setFieldErrors((previous) => ({
              ...previous,
              code: undefined,
            }));
          }}
        />

        {!isVerify && (
          <>
            <AuthInput
              label="New Password"
              name="password"
              type="password"
              placeholder="Create a new password"
              autoComplete="new-password"
              minLength={12}
              maxLength={256}
              icon={<LockKeyhole size={14} />}
              passwordToggle
              error={fieldErrors.password}
              onChange={(value) => {
                setPassword(value);

                setFieldErrors((previous) => ({
                  ...previous,
                  password: undefined,
                }));
              }}
            />

            <PasswordStrength password={password} />

            <AuthInput
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              minLength={12}
              maxLength={256}
              icon={<ShieldCheck size={14} />}
              passwordToggle
              error={fieldErrors.confirmPassword}
              onChange={(value) => {
                setFieldErrors((previous) => ({
                  ...previous,
                  confirmPassword:
                    value && value !== password ? 'Passwords do not match.' : undefined,
                }));
              }}
            />
          </>
        )}

        <button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[11px] font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-[#df6035] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? (
            <>
              <LoaderCircle className="animate-spin" size={15} />
              PLEASE WAIT
            </>
          ) : (
            <>
              {isVerify ? 'Verify Email' : 'Reset Password'}
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {isVerify && (
        <button
          className="mt-5 w-full text-center text-[11px] font-semibold text-brand transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={resendCode}
          disabled={resending}
        >
          {resending ? 'Sending another code...' : 'Send another code'}
        </button>
      )}

      {error && (
        <div className="mt-4">
          <FormMessage message={error} />
        </div>
      )}

      {message && (
        <div className="mt-4">
          <FormMessage message={message} type="success" />
        </div>
      )}

      <p className="mt-6 border-t border-[#eceef2] pt-5 text-center text-[10px] text-[#777f90]">
        <Link
          className="font-semibold text-brand transition hover:underline"
          href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

function ForgotPasswordForm({ returnTo }: { returnTo: string }) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPending(true);
    setError('');
    setEmailError('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setEmailError('Email address is required.');
      setPending(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError('Please enter a valid email address.');
      setPending(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('We could not process that request. Please try again.');
      }

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
    <div className="mx-auto w-full max-w-[390px] rounded-2xl border border-[#eceef2] bg-white px-6 py-7 shadow-[0_12px_45px_rgba(36,35,31,0.06)] sm:px-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1eb] text-brand">
          <KeyRound size={21} />
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#202331]">
          Find your way back
        </h1>

        <p className="mt-2 text-[11px] leading-5 text-[#858b9a]">
          Enter your email and we&apos;ll send a password reset code if an account matches.
        </p>
      </div>

      {sent ? (
        <div className="rounded-xl border border-[#eceef2] bg-[#fafbfc] p-4" role="status">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check size={19} />
          </div>

          <p className="mt-3 text-[12px] font-semibold text-[#303647]">Check your inbox</p>

          <p className="mt-1 text-[11px] leading-5 text-[#777f90]">
            If an account matches that email, a reset code is on its way.
          </p>

          <Link
            className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold text-brand hover:underline"
            href={`/reset-password?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`}
          >
            Enter your reset code
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit} noValidate>
          <AuthInput
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            maxLength={254}
            icon={<Mail size={14} />}
            value={email}
            error={emailError}
            onChange={(value) => {
              setEmail(value);
              setEmailError('');
              setError('');
            }}
          />

          <button
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[11px] font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-[#df6035] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? (
              <>
                <LoaderCircle className="animate-spin" size={15} />
                PLEASE WAIT
              </>
            ) : (
              <>
                Send Reset Code
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>
      )}

      {error && (
        <div className="mt-4">
          <FormMessage message={error} />
        </div>
      )}

      <p className="mt-6 border-t border-[#eceef2] pt-5 text-center text-[10px] text-[#777f90]">
        <Link
          className="font-semibold text-brand transition hover:underline"
          href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function AuthForm(props: AuthFormProps) {
  const {
    mode,
    returnTo,
    email = '',
    googleEnabled = false,
    googleError = false,
    passwordReset = false,
  } = props;

  if (mode === 'verify' || mode === 'reset') {
    return <EmailCodeForm mode={mode} email={email} returnTo={returnTo} />;
  }

  if (mode === 'forgot-password') {
    return <ForgotPasswordForm returnTo={returnTo} />;
  }

  return (
    <SignInSignUpForm
      mode={mode}
      returnTo={returnTo}
      googleEnabled={googleEnabled}
      googleError={googleError}
      passwordReset={passwordReset}
    />
  );
}
