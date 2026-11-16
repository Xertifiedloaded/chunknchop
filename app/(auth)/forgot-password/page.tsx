import type { Metadata } from 'next';
import AuthShell from '@/components/auth-shell';
import { ForgotPasswordForm } from '@/components/auth-code-form';
import { safeReturnTo } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Forgot password | ChunknChop',
  description: 'Request a password reset code for your ChunknChop account.',
};

type PageProps = { searchParams: Promise<{ returnTo?: string }> };

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const { returnTo } = await searchParams;
  return (
    <AuthShell>
      <ForgotPasswordForm returnTo={safeReturnTo(returnTo)} />
    </AuthShell>
  );
}
