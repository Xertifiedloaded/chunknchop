
import type { Metadata } from 'next';

import AuthShell from '@/components/auth/auth-shell';
import AuthForm from '@/components/auth/auth-form';

export const metadata: Metadata = {
  title: 'Forgot password | ChunknChop',
  description: 'Request a password reset code for your ChunknChop account.',
};

type PageProps = {
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps) {
  const { returnTo } = await searchParams;

  return (
    <AuthShell mode="forgot">
      <AuthForm
        mode="forgot-password"
        returnTo={returnTo ?? ''}
      />
    </AuthShell>
  );
}
