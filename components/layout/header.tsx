'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  Truck,
  X,
  UserRound,
  Package,
  Settings,
  LoaderCircle,
} from 'lucide-react';

import { useCart } from '@/components/cart/cart-provider';
import { useAuth } from '@/components/auth/auth-provider';
import SignOutButton from '@/components/auth/sign-out-button';

export default function Header() {
  const { user, isLoading, refreshSession } = useAuth();
  const { items } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);

  const cartCount = items?.reduce((total, item) => total + (Number(item.quantity) || 0), 0) ?? 0;

  const normalizedRole = String(user?.role ?? '')
    .trim()
    .toUpperCase();

  const dashboard =
    normalizedRole === 'ADMIN'
      ? {
          href: '/admin',
          label: 'Admin dashboard',
          roleLabel: 'Administrator',
          icon: Settings,
        }
      : normalizedRole === 'RIDER'
        ? {
            href: '/rider',
            label: 'Rider dashboard',
            roleLabel: 'Delivery rider',
            icon: Truck,
          }
        : null;

  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'U';

  function closeMenus() {
    setMenuOpen(false);
    setAccountOpen(false);
  }

  useEffect(() => {
    void refreshSession();

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void refreshSession();
      }
    }

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshSession]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMenus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const dashboardLink = dashboard && (
    <Link
      href={dashboard.href}
      onClick={closeMenus}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-[#26352d] transition hover:bg-[#f5f7f4]"
    >
      <dashboard.icon size={16} className="shrink-0 text-[#e86b3e]" />
      <span>{dashboard.label}</span>
    </Link>
  );

  return (
    <>
      {}
      <div className="flex h-8 items-center justify-between bg-[#24231f] px-[7.1%] text-[9px] font-semibold tracking-[0.13em] text-[#f7f5ef] max-[900px]:px-[5%] max-[650px]:justify-center max-[650px]:px-3 max-[650px]:text-[8px]">
        <span>GOOD FOOD STARTS WITH GOOD SOURCING.</span>

        <span className="flex items-center gap-2 text-[#e7c7a7] max-[650px]:hidden">
          <Truck size={14} />
          THOUGHTFULLY SOURCED, CAREFULLY CUT
        </span>
      </div>

      <header className="sticky top-0 z-50 border-b border-[#efeee9] bg-white">
        <div className="relative mx-auto flex h-[76px] max-w-[1600px] items-center justify-between px-[7.1%] max-[900px]:px-[5%] max-[650px]:h-[65px]">
          {}
          <Link
            href="/"
            onClick={closeMenus}
            className="flex shrink-0 items-center gap-2"
            aria-label="ChunkNChop home"
          >
            <span className="whitespace-nowrap text-[12px] font-black tracking-[0.17em] text-[#24231f] max-[650px]:text-[10px]">
              ChunkNChop
            </span>
          </Link>

          {}
          <nav
            className="flex items-center gap-8 text-[12px] text-[#484741] max-[900px]:hidden"
            aria-label="Main navigation"
          >
            <Link href="/shop" className="transition hover:text-[#e86b3e]">
              Shop all
            </Link>

            <Link
              href="/#categories"
              className="flex items-center gap-1 transition hover:text-[#e86b3e]"
            >
              Our cuts
              <ChevronDown size={13} />
            </Link>

            <Link href="/#story" className="transition hover:text-[#e86b3e]">
              Our story
            </Link>
          </nav>

          {}
          <div className="flex items-center gap-6 max-[650px]:gap-4">
            <Link
              href="/shop"
              className="text-[#484741] transition hover:text-[#e86b3e] max-[650px]:hidden"
              aria-label="Search products"
            >
              <Search size={18} />
            </Link>

            {}
            <div ref={accountRef} className="relative max-[900px]:hidden">
              {isLoading ? (
                <div className="flex h-9 w-24 items-center justify-center">
                  <LoaderCircle size={16} className="animate-spin text-[#e86b3e]" />
                </div>
              ) : user ? (
                <button
                  type="button"
                  onClick={() => setAccountOpen((open) => !open)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-[#f8f7f4]"
                >
                  <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#f4e9e2] text-[11px] font-bold text-[#a9442c]">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        fill
                        sizes="36px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </span>

                  <span className="max-w-[105px] truncate text-[11px] font-semibold text-[#34332e]">
                    {user.name}
                  </span>

                  <ChevronDown
                    size={14}
                    className={`text-[#77736d] transition ${accountOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              ) : (
                <Link
                  href="/account"
                  className="text-[11px] font-semibold text-[#484741] transition hover:text-[#e86b3e]"
                >
                  Sign in
                </Link>
              )}

              {}
              {user && accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+14px)] z-[60] w-[250px] overflow-hidden rounded-2xl border border-[#eeece7] bg-white p-2 shadow-[0_15px_50px_rgba(0,0,0,0.12)]"
                >
                  <div className="border-b border-[#efeee9] px-3 py-3">
                    <p className="truncate text-[12px] font-bold text-[#24231f]">{user.name}</p>

                    <p className="mt-1 truncate text-[10px] text-[#88847d]">{user.email}</p>

                    {dashboard && (
                      <span className="mt-2 inline-flex rounded-full bg-[#f8eee8] px-2 py-1 text-[9px] font-semibold text-[#a9442c]">
                        {dashboard.roleLabel}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 py-2">
                    <Link
                      href="/account"
                      onClick={closeMenus}
                      role="menuitem"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-[#484741] transition hover:bg-[#f5f7f4]"
                    >
                      <UserRound size={16} />
                      My account
                    </Link>

                    <Link
                      href="/account/orders"
                      onClick={closeMenus}
                      role="menuitem"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] text-[#484741] transition hover:bg-[#f5f7f4]"
                    >
                      <Package size={16} />
                      My orders
                    </Link>

                    {dashboardLink}
                  </div>

                  <div className="border-t border-[#efeee9] pt-2">
                    <SignOutButton />
                  </div>
                </div>
              )}
            </div>

            {}
            <Link
              href="/cart"
              className="relative flex items-center text-[#484741] transition hover:text-[#e86b3e]"
              aria-label={`Shopping bag, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            >
              <ShoppingBag size={19} />

              {cartCount > 0 && (
                <span className="absolute -right-2.5 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#e86b3e] px-1 text-[9px] font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="hidden text-[#34332e] max-[900px]:grid"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        {}
        {menuOpen && (
          <div className="absolute left-0 right-0 top-full z-50 max-h-[calc(100vh-100px)] overflow-y-auto border-t border-[#efeee9] bg-white px-[5%] pb-6 pt-5 shadow-[0_15px_30px_rgba(0,0,0,0.08)] min-[901px]:hidden">
            <nav className="flex flex-col gap-1 text-[13px] text-[#484741]">
              <Link
                href="/shop"
                onClick={closeMenus}
                className="rounded-lg px-3 py-3 transition hover:bg-[#f8f7f4]"
              >
                Shop all
              </Link>

              <Link
                href="/#categories"
                onClick={closeMenus}
                className="rounded-lg px-3 py-3 transition hover:bg-[#f8f7f4]"
              >
                Our cuts
              </Link>

              <Link
                href="/#story"
                onClick={closeMenus}
                className="rounded-lg px-3 py-3 transition hover:bg-[#f8f7f4]"
              >
                Our story
              </Link>

              <Link
                href="/account"
                onClick={closeMenus}
                className="rounded-lg px-3 py-3 transition hover:bg-[#f8f7f4]"
              >
                My account
              </Link>
            </nav>

            <div className="my-4 border-t border-[#efeee9]" />

            {isLoading ? (
              <div className="flex items-center gap-2 px-3 py-3 text-[11px] text-[#77736d]">
                <LoaderCircle size={15} className="animate-spin text-[#e86b3e]" />
                Loading account...
              </div>
            ) : user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#f4e9e2] text-[12px] font-bold text-[#a9442c]">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        fill
                        sizes="40px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold text-[#24231f]">{user.name}</p>
                    <p className="truncate text-[10px] text-[#88847d]">{user.email}</p>
                  </div>
                </div>

                {dashboard && (
                  <div className="mb-3 rounded-xl bg-[#f8f7f4] p-2">
                    <p className="px-3 pb-2 pt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#99938b]">
                      {dashboard.roleLabel}
                    </p>

                    {dashboardLink}
                  </div>
                )}

                <Link
                  href="/account/orders"
                  onClick={closeMenus}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-[12px] text-[#484741] transition hover:bg-[#f8f7f4]"
                >
                  <Package size={16} />
                  My orders
                </Link>

                <div className="mt-2 border-t border-[#efeee9] pt-2">
                  <SignOutButton />
                </div>
              </>
            ) : (
              <div className="flex gap-3 px-3">
                <Link
                  href="/account"
                  onClick={closeMenus}
                  className="flex h-10 flex-1 items-center justify-center rounded-lg border border-[#e8e5df] text-[11px] font-semibold text-[#34332e]"
                >
                  Sign in
                </Link>

                <Link
                  href="/account/register"
                  onClick={closeMenus}
                  className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#e86b3e] text-[11px] font-semibold text-white"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
