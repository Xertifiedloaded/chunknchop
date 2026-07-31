'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Enter your email address');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      router.push(`/otp?email=${encodeURIComponent(email)}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/auth/login" className="text-muted-foreground mb-4 inline-flex items-center gap-1.5 text-sm hover:text-black">
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <h2 className="text-2xl font-bold text-black">Forgot your password?</h2>
        <p className="text-muted-foreground mt-2 text-sm">Enter the email linked to your account and we&apos;ll send you a code to reset it.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-black">
            Email address
          </label>
          <div className="relative">
            <Mail className="text-muted-foreground absolute top-1/2 left-3.5 -translate-y-1/2" size={18} />
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="focus:border-brand focus:ring-brand/20 w-full rounded-xl border border-[#E5E7EB] py-3 pr-4 pl-11 text-sm text-black placeholder:text-[#9CA3AF] focus:ring-2 focus:outline-none" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="bg-brand w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? 'Sending code…' : 'Send reset code'}
        </button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Remembered your password?{' '}
        <Link href="/auth/login" className="text-brand font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
