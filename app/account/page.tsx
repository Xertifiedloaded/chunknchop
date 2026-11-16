import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import SignOutButton from '@/components/sign-out-button';
import { getSession } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin-api';

export const metadata: Metadata = {
  title: 'Your account | ChunknChop',
  description: 'Manage your ChunknChop account.',
};

export default async function AccountPage() {
  const session = await getSession(await headers());
  if (!session?.user) redirect('/sign-in?returnTo=%2Faccount');

  return (
    <main className="account-page">
      <header className="catalog-top">
        <Link href="/" className="catalog-back">
          BACK TO SHOP
        </Link>
        <Link href="/" className="catalog-wordmark">
          ChunknChop
        </Link>
        <Link href="/shop" className="catalog-bag">
          SHOP THE COUNTER
        </Link>
      </header>
      <section className="account-card">
        <p className="eyebrow">
          <span /> YOUR ACCOUNT
        </p>
        <h1>
          Welcome, <em>{session.user.name || 'friend'}.</em>
        </h1>
        <p className="account-description">Your sign-in is securely managed by ChunknChop.</p>
        <dl className="account-details">
          <div>
            <dt>Name</dt>
            <dd>{session.user.name || 'Not provided'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{session.user.email}</dd>
          </div>
          <div>
            <dt>Email status</dt>
            <dd>{session.user.emailVerified ? 'Verified' : 'Not verified'}</dd>
          </div>
        </dl>
        <div className="account-actions">
          <Link className="admin-primary-button" href="/account/orders">
            YOUR ORDERS <span aria-hidden="true">↗</span>
          </Link>
          {session.user.role === 'rider' && (
            <Link className="admin-secondary-button" href="/rider">
              RIDER ROUTE <span aria-hidden="true">↗</span>
            </Link>
          )}
          {isAdminUser(session.user) && (
            <Link className="admin-secondary-button" href="/admin">
              OPEN ADMIN <span aria-hidden="true">↗</span>
            </Link>
          )}
          <SignOutButton />
        </div>
      </section>
      <footer className="catalog-footer">
        <span>ChunknChop</span>
        <span>GOOD MEAT. GOOD LIVING.</span>
        <Link href="/shop">SHOP THE COUNTER</Link>
      </footer>
    </main>
  );
}
