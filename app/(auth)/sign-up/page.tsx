import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/auth-form';
import AuthShell from '@/components/auth-shell';
import { getSession, isGoogleAuthEnabled, safeReturnTo } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Create account | ChunknChop',
  description: 'Create your ChunknChop account.',
};

type PageProps = { searchParams: Promise<{ returnTo?: string }> };

export default async function SignUpPage({ searchParams }: PageProps) {
  const [session, query] = await Promise.all([getSession(await headers()), searchParams]);
  const returnTo = safeReturnTo(query.returnTo);
  if (session?.user) redirect(returnTo);

  return (
    <AuthShell>
      <AuthForm mode="sign-up" returnTo={returnTo} googleEnabled={isGoogleAuthEnabled} />
    </AuthShell>
  );
}
