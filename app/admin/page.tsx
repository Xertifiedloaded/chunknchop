import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminProducts from '@/components/admin-products';
import AdminOrders from '@/components/admin-orders';
import SignOutButton from '@/components/sign-out-button';
import { getSession } from '@/lib/auth';
import { isAdminUser } from '@/lib/admin-api';
import { toCatalogProduct } from '@/lib/products';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Admin | ChunknChop',
  description: 'Manage the live ChunknChop product catalogue.',
};

export default async function AdminPage() {
  const session = await getSession(await headers());
  if (!session?.user) redirect('/sign-in?returnTo=%2Fadmin');

  if (!isAdminUser(session.user)) {
    return (
      <main className="admin-page">
        <header className="catalog-top">
          <Link href="/" className="catalog-back">
            BACK TO SHOP
          </Link>
          <Link href="/" className="catalog-wordmark">
            ChunknChop
          </Link>
          <SignOutButton />
        </header>
        <section className="admin-denied">
          <p className="eyebrow">
            <span /> ADMIN ACCESS
          </p>
          <h1>
            Access is <em>restricted.</em>
          </h1>
          <p>
            This account is not authorized to manage the catalogue. Add this email to the
            server-side ADMIN_EMAILS allowlist, or grant the admin role in the database.
          </p>
          <Link href="/account" className="admin-secondary-button">
            RETURN TO ACCOUNT
          </Link>
        </section>
      </main>
    );
  }

  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <main className="admin-page">
      <header className="catalog-top">
        <Link href="/" className="catalog-back">
          BACK TO SHOP
        </Link>
        <Link href="/" className="catalog-wordmark">
          ChunknChop
        </Link>
        <div className="admin-header-actions">
          <span>{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>
      <section className="admin-content">
        <div className="admin-title">
          <div>
            <p className="eyebrow">
              <span /> ChunknChop · ADMIN
            </p>
            <h1>
              Counter <em>management.</em>
            </h1>
            <p>Manage products stored in MongoDB. Public pages show published products only.</p>
          </div>
          <Link href="/shop" className="admin-secondary-button">
            VIEW STOREFRONT <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <AdminOrders />
        <AdminProducts initialProducts={products.map(toCatalogProduct)} />
      </section>
    </main>
  );
}
