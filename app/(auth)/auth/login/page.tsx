
'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock, Mail } from 'lucide-react';

import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginForm />
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { setUser, setAccessToken } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Unable to sign in. Please try again.');
        return;
      }

      const { user, accessToken } = data;

      setUser(user);
      setAccessToken(accessToken);

      localStorage.setItem('token', accessToken);

      const redirect = searchParams.get('redirect') || '/';

      router.push(redirect);
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Side - Branding */}
        <div className="relative hidden overflow-hidden bg-primary lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)]" />

          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-16">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-primary-foreground"
            >
              ChunkNChop
            </Link>

            <div className="max-w-lg">
              <span className="mb-4 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground">
                Fresh. Quality. Delivered.
              </span>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-primary-foreground xl:text-6xl">
                Welcome back to better shopping.
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-primary-foreground/70 xl:text-lg">
                Sign in to manage your orders, save your favorite products,
                and enjoy a seamless ChunkNChop shopping experience.
              </p>
            </div>

            <p className="text-sm text-primary-foreground/50">
              © {new Date().getFullYear()} ChunkNChop. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Side - Login */}
        <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="mb-10 text-center lg:hidden">
              <Link
                href="/"
                className="text-2xl font-bold tracking-tight text-primary"
              >
                ChunkNChop
              </Link>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
              {/* Header */}
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Welcome Back
                </h2>

                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Sign in to your ChunkNChop account
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
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
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium"
                    >
                      Password
                    </label>

                    <Link
                      href="/auth/forgot-password"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="h-11 pl-10"
                      required
                    />
                  </div>
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
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />

                <span className="text-xs text-muted-foreground">
                  OR
                </span>

                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Signup */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  New to ChunkNChop?
                </p>

                <Link href="/auth/signup" className="mt-3 block">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full"
                  >
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-muted-foreground lg:hidden">
              © {new Date().getFullYear()} ChunkNChop. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

