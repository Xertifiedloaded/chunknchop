import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import AuthShell from '@/components/auth/auth-shell';
import { getSession, safeReturnTo } from '@/lib/auth';
import AuthForm from '@/components/auth/auth-form';

export const metadata: Metadata = {
  title: 'Verify your email | ChunknChop',
  description: 'Verify your email address to finish creating your ChunknChop account.',
};

type PageProps = {
  searchParams: Promise<{
    email?: string;
    returnTo?: string;
  }>;
};

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const [{ email = '', returnTo }, requestHeaders] = await Promise.all([searchParams, headers()]);

  const session = await getSession(requestHeaders);
  const destination = safeReturnTo(returnTo);

  if (session?.user) redirect(destination);

  return (
    <AuthShell mode="verify">
      <AuthForm mode="verify" email={email} returnTo={returnTo} />
    </AuthShell>
  );
}
