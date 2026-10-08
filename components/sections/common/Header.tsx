'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, Menu, X, LogOut, Package, ChevronRight, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import logo from '../../../assets/header-logo.svg';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import CartDropdown from './CartDropdown';
import { NAV_LINKS, ROLE_STYLES } from '@/lib';

type Panel = 'menu' | 'search' | 'cart' | 'account' | null;

type SessionUser = {
  name?: string | null;
  email: string;
  role?: string;
  staffRole?: string | null;
};

const ACCOUNT_LINKS = [
  { href: '/orders', label: 'Orders' },
  { href: '/account/subscriptions', label: 'Subscriptions' },
  { href: '/account/wholesale', label: 'Wholesale' },
  { href: '/account/support', label: 'Support' },
];

const dropdownLinkClass = 'text-charcoal block px-4 py-2.5 text-sm hover:bg-neutral-50';
const drawerWorkspaceLinkClass = 'text-charcoal flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors hover:bg-neutral-50';

function getRoleStyle(role?: string) {
  return ROLE_STYLES[role ?? ''] ?? ROLE_STYLES.CUSTOMER;
}

function formatStaffRole(staffRole?: string | null) {
  if (!staffRole) return 'Staff';

  return staffRole
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getRoleLabel(user?: Pick<SessionUser, 'role' | 'staffRole'> | null) {
  return user?.role === 'STAFF' ? formatStaffRole(user.staffRole) : getRoleStyle(user?.role).label;
}

function getInitial(user: SessionUser) {
  return (user.name?.trim()?.[0] ?? user.email[0]).toUpperCase();
}

function getFirstName(user: SessionUser) {
  return user.name?.split(' ')[0] ?? user.email.split('@')[0];
}

function Avatar({ user, sizeClass, colorClass }: { user: SessionUser; sizeClass: string; colorClass: string }) {
  return <span className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white uppercase ${sizeClass} ${colorClass}`}>{getInitial(user)}</span>;
}

function DrawerLink({ href, onClick, children }: { href: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="text-charcoal group flex items-center justify-between rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors hover:bg-neutral-50 active:bg-neutral-100">
      <span>{children}</span>
      <ChevronRight size={15} className="text-neutral-300 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-400" />
    </Link>
  );
}

function DrawerSectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pt-4 pb-1.5 text-[10.5px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">{children}</p>;
}

export default function HeaderOld() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user) as SessionUser | null;
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const logout = useAuthStore((state) => state.logout);
  const cartItems = useCartStore((state) => state.items);
  const setCartItems = useCartStore((state) => state.setItems);

  const [panel, setPanel] = useState<Panel>(null);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const menuOpen = panel === 'menu';
  const searchOpen = panel === 'search';
  const cartOpen = panel === 'cart';
  const accountOpen = panel === 'account';

  const isSupplier = user?.role === 'SUPPLIER';
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isInternalRole = isSupplier || isStaff;
  const roleStyle = getRoleStyle(user?.role);
  const roleLabel = getRoleLabel(user);

  const cartCount = useMemo(() => {
    if (!user || isInternalRole) return 0;
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [user, isInternalRole, cartItems]);

  const toggle = useCallback((name: Exclude<Panel, null>) => {
    setPanel((current) => (current === name ? null : name));
  }, []);

  const closeAll = useCallback(() => setPanel(null), []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!panel) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setPanel(null);
    }

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [panel]);

  useEffect(() => {
    if (!accountOpen) return;

    function handleClick(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setPanel(null);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [accountOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    router.push(`/shop?search=${encodeURIComponent(trimmedQuery)}`);
    closeAll();
  }

  async function handleLogout() {
    closeAll();
    const succeeded = await logout();
    setCartItems([]);
    if (!succeeded) toast.error('Logout request failed');
    router.push('/');
    router.refresh();
  }

  return (
    <header className="relative z-50 overflow-x-hidden border-b border-neutral-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 lg:px-10">
        <div className="relative flex min-w-0 shrink-0 items-center">
          <Link href="/" onClick={closeAll} className={`block transition-all duration-200 ${menuOpen && user ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
            <Image src={logo} alt="ChunkNChop" priority className="h-auto w-32 sm:w-40" />
          </Link>

          {user && (
            <div className={`absolute left-0 flex items-center gap-2 transition-all duration-200 lg:hidden ${menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
              <Avatar user={user} sizeClass="h-8 w-8 text-xs" colorClass={roleStyle.avatar} />

              <div className="flex min-w-0 flex-col leading-tight">
                <span className="text-charcoal max-w-32 truncate text-xs font-semibold">{getFirstName(user)}</span>
                <span className={`w-fit rounded px-1.5 py-0.5 text-[9px] font-semibold ${roleStyle.badge}`}>{roleLabel}</span>
              </div>
            </div>
          )}
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {!isInternalRole &&
            NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="text-charcoal text-sm transition-colors hover:text-neutral-900">
                {link.label}
              </Link>
            ))}

          {isSupplier && (
            <Link href="/supplier/dashboard" className="text-charcoal flex items-center gap-2 text-sm">
              <Package size={16} />
              Dashboard
            </Link>
          )}

          {isStaff && (
            <Link href="/staff/dashboard" className="text-charcoal flex items-center gap-2 text-sm">
              <Package size={16} />
              Staff Dashboard
            </Link>
          )}

          {isAdmin && (
            <Link href="/admin" className="text-charcoal text-sm">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4 sm:gap-6">
          {!isInternalRole && (
            <button type="button" onClick={() => toggle('search')} aria-label={searchOpen ? 'Close search' : 'Open search'} className="text-neutral-500 transition hover:text-neutral-900">
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
          )}

          <div ref={accountRef} className="relative hidden sm:block">
            {!isHydrated ? (
              <div className="h-8 w-24" aria-hidden="true" />
            ) : user ? (
              <>
                <button type="button" onClick={() => toggle('account')} aria-label="Open account menu" aria-expanded={accountOpen} className="flex items-center gap-2 text-neutral-500 transition hover:text-neutral-900">
                  <Avatar user={user} sizeClass="h-8 w-8 text-xs" colorClass={roleStyle.avatar} />

                  <span className="hidden flex-col items-start md:flex">
                    <span className="text-charcoal max-w-30 truncate text-xs font-medium">{getFirstName(user)}</span>

                    {(isAdmin || isInternalRole) && <span className={`rounded px-1.5 py-0.5 text-[10px] leading-tight font-semibold ${roleStyle.badge}`}>{roleLabel}</span>}
                  </span>
                </button>

                {accountOpen && (
                  <div className="animate-in fade-in slide-in-from-top-1 absolute right-0 mt-3 w-52 overflow-hidden rounded-lg border border-neutral-100 bg-white shadow-lg duration-200">
                    <div className="border-b border-neutral-100 px-4 py-2.5">
                      <p className="truncate text-xs text-neutral-400">{user.email}</p>
                      <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${roleStyle.badge}`}>{roleLabel}</span>
                    </div>

                    {!isInternalRole &&
                      ACCOUNT_LINKS.map((link) => (
                        <Link key={link.href} href={link.href} onClick={closeAll} className={dropdownLinkClass}>
                          {link.label}
                        </Link>
                      ))}

                    {isSupplier && (
                      <Link href="/supplier/dashboard" onClick={closeAll} className={dropdownLinkClass}>
                        Dashboard
                      </Link>
                    )}

                    {isStaff && (
                      <Link href="/staff/dashboard" onClick={closeAll} className={dropdownLinkClass}>
                        Staff Dashboard
                      </Link>
                    )}

                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 border-t border-neutral-100 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50">
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="text-charcoal text-sm">
                  Sign In
                </Link>

                <Link href="/auth/signup" className="bg-brand rounded-md px-4 py-1.5 text-sm font-semibold text-white transition hover:opacity-90">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {!isInternalRole && (
            <button type="button" onClick={() => toggle('cart')} aria-label="Open shopping cart" className="relative text-neutral-500 transition hover:text-neutral-900">
              <ShoppingBag size={20} />

              {cartCount > 0 && <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#e07a3f] text-[10px] font-semibold text-white">{cartCount}</span>}
            </button>
          )}

          <button type="button" onClick={() => toggle('menu')} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} className="text-charcoal lg:hidden">
            <span className="relative block h-[22px] w-[22px]">
              <Menu size={22} className={`absolute inset-0 transition-all duration-200 ${menuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
              <X size={22} className={`absolute inset-0 transition-all duration-200 ${menuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
            </span>
          </button>
        </div>
      </div>

      {!isInternalRole && (
        <div className={`grid overflow-hidden border-t border-neutral-100 transition-[grid-template-rows] duration-300 ease-in-out ${searchOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] border-t-0'}`}>
          <div className="overflow-hidden">
            <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3 lg:px-10">
              <Search size={18} className="text-neutral-400" />

              <input ref={searchInputRef} type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search premium meat..." aria-label="Search products" className="text-charcoal w-full bg-transparent text-sm outline-none placeholder:text-neutral-400" />
            </form>
          </div>
        </div>
      )}

      {!isInternalRole && <CartDropdown isOpen={cartOpen} onClose={closeAll} />}

      <div onClick={closeAll} aria-hidden="true" className={`fixed inset-0 z-[60] bg-black/45 backdrop-blur-[1px] transition-opacity duration-300 lg:hidden ${menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />

      <aside role="dialog" aria-modal="true" aria-label="Navigation menu" className={`fixed inset-y-0 right-0 z-[70] flex h-dvh w-full max-w-xs flex-col bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-4">
          {user ? (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar user={user} sizeClass="h-11 w-11 text-sm" colorClass={roleStyle.avatar} />

              <div className="min-w-0">
                <p className="text-charcoal truncate text-sm font-semibold">{user.name || user.email.split('@')[0]}</p>
                <p className="truncate text-xs text-neutral-400">{user.email}</p>
                <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${roleStyle.badge}`}>{roleLabel}</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-charcoal text-sm font-semibold">Welcome</p>
              <p className="text-xs text-neutral-400">Sign in for the full experience</p>
            </div>
          )}

          <button type="button" onClick={closeAll} aria-label="Close menu" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
          {(isSupplier || isStaff || isAdmin) && (
            <>
              <DrawerSectionLabel>Workspace</DrawerSectionLabel>

              <div className="flex flex-col gap-0.5">
                {isSupplier && (
                  <Link href="/supplier/dashboard" onClick={closeAll} className={drawerWorkspaceLinkClass}>
                    <Package size={16} className="text-neutral-400" />
                    Dashboard
                  </Link>
                )}

                {isStaff && (
                  <Link href="/staff/dashboard" onClick={closeAll} className={drawerWorkspaceLinkClass}>
                    <Package size={16} className="text-neutral-400" />
                    Staff Dashboard
                  </Link>
                )}

                {isAdmin && (
                  <Link href="/admin" onClick={closeAll} className={drawerWorkspaceLinkClass}>
                    <LayoutGrid size={16} className="text-neutral-400" />
                    Admin
                  </Link>
                )}
              </div>
            </>
          )}

          {!isInternalRole && (
            <>
              <DrawerSectionLabel>Shop</DrawerSectionLabel>

              <div className="flex flex-col gap-0.5">
                {NAV_LINKS.map((link) => (
                  <DrawerLink key={link.label} href={link.href} onClick={closeAll}>
                    {link.label}
                  </DrawerLink>
                ))}
              </div>
            </>
          )}

          {user && !isInternalRole && (
            <>
              <DrawerSectionLabel>Account</DrawerSectionLabel>

              <div className="flex flex-col gap-0.5">
                {ACCOUNT_LINKS.map((link) => (
                  <DrawerLink key={link.href} href={link.href} onClick={closeAll}>
                    {link.label}
                  </DrawerLink>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-neutral-100 px-5 py-4">
          {!user ? (
            <div className="flex gap-3">
              <Link href="/auth/login" onClick={closeAll} className="text-charcoal flex-1 rounded-md border border-neutral-200 px-4 py-2.5 text-center text-sm font-medium transition hover:bg-neutral-50">
                Sign In
              </Link>

              <Link href="/auth/signup" onClick={closeAll} className="bg-brand flex-1 rounded-md px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90">
                Sign Up
              </Link>
            </div>
          ) : (
            <button type="button" onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-md border border-red-100 bg-red-50 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-100">
              <LogOut size={15} />
              Logout
            </button>
          )}
        </div>
      </aside>
    </header>
  );
}