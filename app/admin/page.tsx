
import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminProducts from '@/components/admin/admin-products';
import AdminOrders from '@/components/admin/admin-orders';
import SignOutButton from '@/components/auth/sign-out-button';
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
      <main className="min-h-screen bg-[#f8f8f6] text-[#24231f]">
        <header className="relative flex min-h-[76px] items-center justify-between border-b border-[#e6e4de] px-5 sm:px-8 lg:px-[10.5%]">
          <Link
            href="/"
            className="text-[10px] font-bold tracking-[0.12em] text-[#77736d] transition-colors hover:text-[#e86b3e]"
          >
            BACK TO SHOP
          </Link>

          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 font-heading text-xl font-bold tracking-tight text-[#24231f] sm:text-2xl"
          >
            ChunknChop
          </Link>

          <SignOutButton />
        </header>

        <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-[620px] flex-col items-start justify-center px-5 py-16 sm:px-8">
          <p className="mb-5 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#88847d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e86b3e]" />
            ADMIN ACCESS
          </p>

          <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight text-[#24231f] sm:text-5xl">
            Access is <em className="font-normal text-[#e86b3e]">restricted.</em>
          </h1>

          <p className="mt-5 max-w-[520px] text-sm leading-7 text-[#77736d]">
            This account is not authorized to manage the catalogue. Add this email to the
            server-side ADMIN_EMAILS allowlist, or grant the admin role in the database.
          </p>

          <Link
            href="/account"
            className="mt-8 inline-flex min-h-12 items-center justify-center border border-[#e6e4de] bg-white px-6 text-[10px] font-bold tracking-[0.12em] text-[#55514a] transition-colors hover:border-[#e86b3e] hover:text-[#e86b3e]"
          >
            RETURN TO ACCOUNT
          </Link>
        </section>
      </main>
    );
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="min-h-screen bg-[#f8f8f6] text-[#24231f]">
      <header className="relative flex min-h-[76px] items-center justify-between border-b border-[#e6e4de] px-5 sm:px-8 lg:px-[10.5%]">
        <Link
          href="/"
          className="text-[10px] font-bold tracking-[0.12em] text-[#77736d] transition-colors hover:text-[#e86b3e]"
        >
          BACK TO SHOP
        </Link>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-heading text-xl font-bold tracking-tight text-[#24231f] sm:text-2xl"
        >
          ChunknChop
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden max-w-[220px] truncate text-xs text-[#77736d] sm:block">
            {session.user.email}
          </span>
          <SignOutButton />
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8 sm:py-14 lg:px-[10.5%]">
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-[#e6e4de] pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#88847d]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e86b3e]" />
              ChunknChop · ADMIN
            </p>

            <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight text-[#24231f] sm:text-4xl lg:text-5xl">
              Counter <em className="font-normal text-[#e86b3e]">management.</em>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#77736d]">
              Manage products stored in MongoDB. Public pages show published products only.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 border border-[#e6e4de] bg-white px-5 text-[10px] font-bold tracking-[0.12em] text-[#55514a] transition-colors hover:border-[#e86b3e] hover:text-[#e86b3e]"
          >
            VIEW STOREFRONT
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="space-y-8">
          <AdminOrders />
          <AdminProducts initialProducts={products.map(toCatalogProduct)} />
        </div>
      </section>
    </main>
  );
}
