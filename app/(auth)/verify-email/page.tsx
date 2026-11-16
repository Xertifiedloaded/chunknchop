import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AuthShell from '@/components/auth-shell';
import { EmailCodeForm } from '@/components/auth-code-form';
import { getSession, safeReturnTo } from '@/lib/auth';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'Verify your email | ChunknChop',
  description: 'Verify your email address to finish creating your ChunknChop account.',
};

type PageProps = { searchParams: Promise<{ email?: string; returnTo?: string }> };

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const [{ email = '', returnTo }, requestHeaders] = await Promise.all([searchParams, headers()]);
  const session = await getSession(requestHeaders);
  const destination = safeReturnTo(returnTo);
  if (session?.user) redirect(destination);
  return (
    <AuthShell>
      <EmailCodeForm mode="verify" email={email} returnTo={destination} />
    </AuthShell>
  );
}
