import type { Metadata } from 'next';

import AuthShell from '@/components/auth/auth-shell';
import { safeReturnTo } from '@/lib/auth';
import AuthForm from '@/components/auth/auth-form';

export const metadata: Metadata = {
  title: 'Reset password | ChunknChop',
  description: 'Reset the password for your ChunknChop account.',
};

type PageProps = {
  searchParams: Promise<{
    email?: string;
    returnTo?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { email = '', returnTo } = await searchParams;

  return (
    <AuthShell mode="reset">
      <AuthForm mode="reset" email={email} returnTo={returnTo} />
    </AuthShell>
  );
}
