import type { Metadata } from 'next';
import AuthShell from '@/components/auth/auth-shell';
import { EmailCodeForm } from '@/components/auth/auth-code-form';
import { safeReturnTo } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Reset password | ChunknChop',
  description: 'Reset the password for your ChunknChop account.',
};

type PageProps = { searchParams: Promise<{ email?: string; returnTo?: string }> };

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { email = '', returnTo } = await searchParams;
  return (
    <AuthShell>
      <EmailCodeForm mode="reset" email={email} returnTo={safeReturnTo(returnTo)} />
    </AuthShell>
  );
}
