'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, LockOpen, Mail } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import AuthInput, { AuthField } from '@/components/auth/AuthInput';
import Image from 'next/image';
import google from '../../../../assets/google.png';
const FIELDS: AuthField[] = [
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    icon: Mail,
    placeholder: 'you@example.com',
    autoComplete: 'email',
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    icon: LockOpen,
    placeholder: 'Enter your password',
    autoComplete: 'current-password',
    linkLabel: 'Forgot password?',
    linkHref: '/auth/forgot-password',
  },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginForm />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
      <Loader2 className="h-5 w-5 animate-spin" />
      Loading...
    </div>
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        credentials: 'include', // ensure refresh cookie is accepted by the browser
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Unable to sign in. Please try again.');
        return;
      }

      const { user, accessToken } = data;

      setUser(user);
      setAccessToken(accessToken);

      // Do NOT persist access token to localStorage or sessionStorage. Keep in-memory only.

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
    <>
      <div className="mb-8 text-center">
        <h2 className="font-sora text-2xl font-bold sm:text-2xl">Welcome Back</h2>
        <p className="text-ink font-worksans mt-2 text-xs">Sign in to your ChunkNChop account</p>
      </div>
      {error && (
        <div role="alert" className="border-destructive/20 bg-destructive/10 text-destructive mb-5 rounded-lg border px-4 py-3 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {FIELDS.map((field) => (
          <AuthInput key={field.name} {...field} value={formData[field.name as keyof typeof formData]} onChange={handleInputChange} />
        ))}
        <Button type="submit" disabled={loading} className="h-11 w-full">
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

      <fieldset className="border-sand my-7 border-0 border-t">
        <legend className="text-ink mx-auto px-3 text-xs font-medium tracking-wide uppercase">Or</legend>
      </fieldset>

      <Button type="button" variant="outline" className="text-charcoal hover:text-charcoal animate-out h-11 w-full border-[#E5E7EB] bg-white text-sm font-bold transition-all hover:bg-gray-50">
        <Image src={google} alt="Google" width={18} height={18} className="mr-2" />
        Continue with Google
      </Button>
      <div className="mt-6 text-center">
        <p className="text-charcoal font-sora text-xs">
          New to ChunkNChop?{' '}
          <Link className="text-brand font-bold" href="/auth/signup">
            Create Account
          </Link>
        </p>
      </div>
    </>
  );
}
