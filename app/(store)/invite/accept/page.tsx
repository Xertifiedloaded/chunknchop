import type { Metadata } from 'next';
import AuthShell from '@/components/auth/auth-shell';
import { InvitationForm } from '@/components/auth/invitation-form';


export const metadata: Metadata = {
  title: 'Accept invitation | ChunknChop',
  description: 'Verify your invitation and set up your ChunknChop account.',
};

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function AcceptInvitationPage({ searchParams }: PageProps) {
  const { email = '' } = await searchParams;

  return (
    <AuthShell>
      <InvitationForm email={email} />
    </AuthShell>
  );
}