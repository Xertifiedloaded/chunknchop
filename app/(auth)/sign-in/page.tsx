import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import AuthForm from '@/components/auth/auth-form';
import AuthShell from '@/components/auth/auth-shell';

import { getSession, isGoogleAuthEnabled, safeReturnTo } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Sign in | ChunknChop',
  description: 'Sign in to your ChunknChop account.',
};

type PageProps = {
  searchParams: Promise<{
    error?: string;
    reset?: string;
    returnTo?: string;
  }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const [session, query] = await Promise.all([getSession(await headers()), searchParams]);

  const returnTo = safeReturnTo(query.returnTo);

  if (session?.user) redirect(returnTo);

  return (
    <AuthShell>
      <AuthForm
        mode="sign-in"
        returnTo={returnTo}
        googleEnabled={isGoogleAuthEnabled}
        googleError={query.error === 'google'}
        passwordReset={query.reset === '1'}
      />
    </AuthShell>
  );
}
