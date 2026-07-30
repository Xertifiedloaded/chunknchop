'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, User, ShoppingBag, Menu, X, LogOut, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import logo from '../../../assets/header-logo.svg';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import CartDropdown from './CartDropdown';
import { NAV_LINKS, ROLE_STYLES } from '@/lib';

function getRoleStyle(role?: string) {
  return ROLE_STYLES[role ?? ''] ?? ROLE_STYLES.CUSTOMER;
}

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { items: cartItems, setItems: setCartItems } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const isSupplier = user?.role === 'SUPPLIER';
  const isAdmin = user?.role === 'ADMIN';
  const roleStyle = getRoleStyle(user?.role);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;

      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
    }
    if (accountOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [accountOpen]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }
    router.push(`/shop?search=${encodeURIComponent(trimmedQuery)}`);
    setSearchOpen(false);
    setMenuOpen(false);
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout failed:', error);

      toast.error('Logout request failed');
    } finally {
      logout();

      setAccountOpen(false);
      setMenuOpen(false);
      setCartOpen(false);

      setCartItems([]);

      router.push('/');
    }
  }

  function closeMobileMenu() {
    setMenuOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
    setAccountOpen(false);
  }

  return (
    <header className="relative z-50 border-b border-neutral-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 lg:px-10">
        <Link href="/" onClick={closeMobileMenu} className="shrink-0">
          <Image src={logo} alt="ChunkNChop" priority className="h-auto w-32 sm:w-40" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {!isSupplier &&
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

          {isAdmin && (
            <Link href="/admin" className="text-charcoal text-sm">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4 sm:gap-6">
          {!isSupplier && (
            <button
              type="button"
              onClick={() => {
                setSearchOpen((value) => !value);

                setCartOpen(false);
                setAccountOpen(false);
              }}
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              className="text-neutral-500 transition hover:text-neutral-900"
            >
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
          )}

          <div ref={accountRef} className="relative hidden sm:block">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen((value) => !value);

                    setCartOpen(false);
                    setSearchOpen(false);
                  }}
                  aria-label="Open account menu"
                  className="flex items-center gap-2 text-neutral-500 transition hover:text-neutral-900"
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white uppercase ${roleStyle.avatar}`}>{(user.name?.trim()?.[0] ?? user.email[0]).toUpperCase()}</span>

                  <span className="hidden flex-col items-start md:flex">
                    <span className="text-charcoal max-w-30 truncate text-xs font-medium">{user.name?.split(' ')[0] ?? user.email.split('@')[0]}</span>

                    {(isAdmin || isSupplier) && <span className={`rounded px-1.5 py-0.5 text-[10px] leading-tight font-semibold ${roleStyle.badge}`}>{roleStyle.label}</span>}
                  </span>
                </button>

                {accountOpen && (
                  <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-lg border border-neutral-100 bg-white shadow-lg">
                    <div className="border-b border-neutral-100 px-4 py-2.5">
                      <p className="truncate text-xs text-neutral-400">{user.email}</p>

                      <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${roleStyle.badge}`}>{roleStyle.label}</span>
                    </div>

                    {!isSupplier && (
                      <>
                        <Link href="/orders" onClick={() => setAccountOpen(false)} className="text-charcoal block px-4 py-2.5 text-sm hover:bg-neutral-50">
                          Orders
                        </Link>

                        <Link href="/account/subscriptions" onClick={() => setAccountOpen(false)} className="text-charcoal block px-4 py-2.5 text-sm hover:bg-neutral-50">
                          Subscriptions
                        </Link>

                        <Link href="/account/wholesale" onClick={() => setAccountOpen(false)} className="text-charcoal block px-4 py-2.5 text-sm hover:bg-neutral-50">
                          Wholesale
                        </Link>

                        <Link href="/account/support" onClick={() => setAccountOpen(false)} className="text-charcoal block px-4 py-2.5 text-sm hover:bg-neutral-50">
                          Support
                        </Link>
                      </>
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

          {!isSupplier && (
            <button
              type="button"
              onClick={() => {
                setCartOpen((value) => !value);

                setSearchOpen(false);
                setAccountOpen(false);
              }}
              aria-label="Open shopping cart"
              className="relative text-neutral-500 transition hover:text-neutral-900"
            >
              <ShoppingBag size={20} />

              {cartCount > 0 && <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#e07a3f] text-[10px] font-semibold text-white">{cartCount}</span>}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMenuOpen((value) => !value);

              setSearchOpen(false);
              setCartOpen(false);
              setAccountOpen(false);
            }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="text-charcoal lg:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {!isSupplier && (
        <div className={`overflow-hidden border-t border-neutral-100 transition-all duration-300 ${searchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3 lg:px-10">
            <Search size={18} className="text-neutral-400" />

            <input ref={searchInputRef} type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search premium meat..." aria-label="Search products" className="text-charcoal w-full bg-transparent text-sm outline-none placeholder:text-neutral-400" />
          </form>
        </div>
      )}

      {!isSupplier && <CartDropdown isOpen={cartOpen} onClose={() => setCartOpen(false)} />}
      <div className={`overflow-hidden border-t border-neutral-100 transition-all duration-300 lg:hidden ${menuOpen ? 'max-h-170 opacity-100' : 'max-h-0 opacity-0'}`}>
        <nav className="flex flex-col px-6 py-4">
          {user && (
            <div className="mb-3 flex items-center gap-3 border-b border-neutral-100 pb-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white uppercase ${roleStyle.avatar}`}>{(user.name?.trim()?.[0] ?? user.email[0]).toUpperCase()}</span>

              <div className="flex flex-col">
                <span className="text-charcoal truncate text-sm font-medium">{user.name?.split(' ')[0] ?? user.email.split('@')[0]}</span>

                <span className={`mt-0.5 inline-block w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold ${roleStyle.badge}`}>{roleStyle.label}</span>
              </div>
            </div>
          )}

          {isSupplier && (
            <Link href="/supplier/dashboard" onClick={() => setMenuOpen(false)} className={`mb-2 flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium ${roleStyle.mobileAccent}`}>
              <Package size={16} />
              Dashboard
            </Link>
          )}

          {isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className={`mb-2 rounded-lg px-3 py-3 text-sm font-medium ${roleStyle.mobileAccent}`}>
              Admin
            </Link>
          )}

          {!isSupplier &&
            NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className="text-charcoal border-b border-neutral-100 py-3 text-sm">
                {link.label}
              </Link>
            ))}

          {!user ? (
            <div className="flex gap-3 py-4 sm:hidden">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-charcoal flex-1 rounded-md border border-neutral-200 px-4 py-2 text-center text-sm font-medium">
                Sign In
              </Link>

              <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="bg-brand flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold text-white">
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="py-4 sm:hidden">
              {!isSupplier && (
                <div className="flex flex-col">
                  <Link href="/orders" onClick={() => setMenuOpen(false)} className="text-charcoal py-2 text-sm">
                    Orders
                  </Link>

                  <Link href="/account/subscriptions" onClick={() => setMenuOpen(false)} className="text-charcoal py-2 text-sm">
                    Subscriptions
                  </Link>

                  <Link href="/account/wholesale" onClick={() => setMenuOpen(false)} className="text-charcoal py-2 text-sm">
                    Wholesale
                  </Link>

                  <Link href="/account/support" onClick={() => setMenuOpen(false)} className="text-charcoal py-2 text-sm">
                    Support
                  </Link>
                </div>
              )}

              <button type="button" onClick={handleLogout} className="mt-3 flex w-full items-center gap-2 border-t border-neutral-100 pt-3 text-left text-sm text-red-500">
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
