
'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Lock,
  Mail,
  User,
  UserRoundPlus,
  Store,
} from 'lucide-react';

import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SignupForm />
    </Suspense>
  );
}

function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading...
      </div>
    </main>
  );
}

function SignupForm() {
  const router = useRouter();

  const { setUser, setAccessToken } = useAuthStore();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'CUSTOMER',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    if (errors.form) {
      setErrors((prev) => ({
        ...prev,
        form: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password =
        'Password must be at least 6 characters';
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm =
        'Please confirm your password';
    } else if (
      formData.password !== formData.passwordConfirm
    ) {
      newErrors.passwordConfirm =
        'Passwords do not match';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          form:
            data?.error ||
            'Unable to create your account. Please try again.',
        });

        return;
      }

      const { user, accessToken } = data;

      setUser(user);
      setAccessToken(accessToken);

      if (formData.role === 'SUPPLIER') {
        router.push('/supplier/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Signup error:', err);

      setErrors({
        form:
          'Something went wrong. Please check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Desktop Branding */}
        <div className="relative hidden overflow-hidden bg-primary lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)]" />

          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-16">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-primary-foreground"
            >
              ChunkNChop
            </Link>

            {/* Content */}
            <div className="max-w-lg">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground">
                <UserRoundPlus className="h-4 w-4" />
                Join the community
              </span>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-primary-foreground xl:text-6xl">
                Everything you need,
                <br />
                all in one place.
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-primary-foreground/70 xl:text-lg">
                Create your ChunkNChop account and enjoy a
                simple, convenient shopping experience.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-primary-foreground/70">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/10">
                    ✓
                  </div>
                  Shop quality products with ease
                </div>

                <div className="flex items-center gap-3 text-sm text-primary-foreground/70">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/10">
                    ✓
                  </div>
                  Track and manage your orders
                </div>

                <div className="flex items-center gap-3 text-sm text-primary-foreground/70">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/10">
                    ✓
                  </div>
                  Get access to your personalized account
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="text-sm text-primary-foreground/50">
              © {new Date().getFullYear()} ChunkNChop. All rights
              reserved.
            </p>
          </div>
        </div>

        {/* Signup Section */}
        <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="mb-8 text-center lg:hidden">
              <Link
                href="/"
                className="text-2xl font-bold tracking-tight text-primary"
              >
                ChunkNChop
              </Link>
            </div>

            {/* Card */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
              {/* Header */}
              <div className="mb-7 text-center">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Create Your Account
                </h2>

                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Join ChunkNChop and start shopping today
                </p>
              </div>

              {/* Form Error */}
              {errors.form && (
                <div
                  role="alert"
                  className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {errors.form}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Account Type */}
                <div className="space-y-2">
                  <label
                    htmlFor="role"
                    className="text-sm font-medium"
                  >
                    Account Type
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                        formData.role === 'CUSTOMER'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="CUSTOMER"
                        checked={
                          formData.role === 'CUSTOMER'
                        }
                        onChange={handleInputChange}
                        className="sr-only"
                      />

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <User className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          Customer
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Shop products
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                        formData.role === 'SUPPLIER'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="SUPPLIER"
                        checked={
                          formData.role === 'SUPPLIER'
                        }
                        onChange={handleInputChange}
                        className="sr-only"
                      />

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Store className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-sm font-medium">
                          Supplier
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sell products
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium"
                  >
                    Full Name
                  </label>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      autoComplete="name"
                      className="h-11 pl-10"
                      required
                    />
                  </div>

                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="h-11 pl-10"
                      required
                    />
                  </div>

                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a password"
                      autoComplete="new-password"
                      className="h-11 pl-10"
                      required
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Use at least 6 characters.
                  </p>

                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="passwordConfirm"
                    className="text-sm font-medium"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="passwordConfirm"
                      type="password"
                      name="passwordConfirm"
                      value={formData.passwordConfirm}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      className="h-11 pl-10"
                      required
                    />
                  </div>

                  {errors.passwordConfirm && (
                    <p className="text-sm text-destructive">
                      {errors.passwordConfirm}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              {/* Login */}
              <div className="mt-7 border-t pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>

            {/* Mobile Footer */}
            <p className="mt-6 text-center text-xs text-muted-foreground lg:hidden">
              © {new Date().getFullYear()} ChunkNChop. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

