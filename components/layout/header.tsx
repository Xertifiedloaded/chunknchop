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
  ArrowRight,
} from 'lucide-react';

import { useCart } from '@/components/cart/cart-provider';
import { useAuth } from '@/components/auth/auth-provider';
import SignOutButton from '@/components/auth/sign-out-button';
import NotificationBell from '@/components/layout/notification-bell';

type SearchProduct = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  cut?: string;
  priceCents: number;
  unit?: string;
  imageUrl?: string;
  badge?: string | null;
  discountPercent?: number;
  discountedPriceCents?: number;
  category?: string;
  published?: boolean;
};

type ProductSearchResponse = {
  products: SearchProduct[];
  total: number;
  page: number;
  pageSize: number;
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format((Number(amount) || 0) / 100);
}

export default function Header() {
  const { user, isLoading, refreshSession } = useAuth();
  const { items } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const accountRef = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

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

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchProducts([]);
    setSearchTotal(0);
    setSearchError('');
    setSearchLoading(false);
  }

  function openSearch() {
    closeMenus();
    setMenuOpen(false);
    setSearchOpen(true);

    window.setTimeout(() => {
      if (window.innerWidth <= 650) {
        mobileInputRef.current?.focus();
      } else {
        desktopInputRef.current?.focus();
      }
    }, 100);
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
      const target = event.target as Node;

      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }

      if (desktopSearchRef.current && !desktopSearchRef.current.contains(target)) {
        if (window.innerWidth > 650) {
          setSearchOpen(false);
          setSearchQuery('');
          setSearchProducts([]);
        }
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMenus();
        closeSearch();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();

    if (!searchOpen || query.length < 2) {
      setSearchProducts([]);
      setSearchTotal(0);
      setSearchLoading(false);
      setSearchError('');
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError('');

        const params = new URLSearchParams({
          q: query,
          page: '1',
          pageSize: '8',
        });

        const response = await fetch(`/api/products?${params.toString()}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Unable to search products right now.');
        }

        const data = (await response.json()) as ProductSearchResponse;

        setSearchProducts(Array.isArray(data.products) ? data.products : []);
        setSearchTotal(Number(data.total) || 0);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        setSearchProducts([]);
        setSearchTotal(0);
        setSearchError('Something went wrong. Please try again.');
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery, searchOpen]);

  const dashboardLink = dashboard && (
    <Link
      href={dashboard.href}
      onClick={() => {
        closeMenus();
        closeSearch();
      }}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-[#26352d] transition hover:bg-[#f5f7f4]"
    >
      <dashboard.icon size={16} className="shrink-0 text-[#e86b3e]" />
      <span>{dashboard.label}</span>
    </Link>
  );

  function renderSearchResults() {
    const query = searchQuery.trim();

    if (query.length < 2) {
      return (
        <div className="px-5 py-8 text-center">
          <Search size={23} className="mx-auto mb-3 text-[#c7c0b8]" />
          <p className="text-[12px] font-medium text-[#514b45]">Search ChunkNChop</p>
          <p className="mt-1 text-[10px] text-[#99918a]">
            Enter at least 2 characters to find products.
          </p>
        </div>
      );
    }

    if (searchLoading) {
      return (
        <div className="flex items-center justify-center gap-2 px-5 py-10 text-[11px] text-[#8d857d]">
          <LoaderCircle size={17} className="animate-spin text-[#e86b3e]" />
          Searching products...
        </div>
      );
    }

    if (searchError) {
      return (
        <div className="px-5 py-9 text-center">
          <p className="text-[12px] font-medium text-[#a9442c]">{searchError}</p>
          <button
            type="button"
            onClick={() => setSearchQuery((value) => value + ' ')}
            className="mt-2 text-[11px] font-semibold text-[#e86b3e]"
          >
            Try again
          </button>
        </div>
      );
    }

    if (searchProducts.length === 0) {
      return (
        <div className="px-5 py-10 text-center">
          <Search size={22} className="mx-auto mb-3 text-[#c7c0b8]" />
          <p className="text-[12px] font-semibold text-[#45413c]">No matching products</p>
          <p className="mt-1 text-[10px] text-[#99918a]">
            Try another product name or search term.
          </p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-[#f0eee9]">
        {searchProducts.map((product) => {
          const hasDiscount =
            Number(product.discountPercent) > 0 &&
            Number(product.discountedPriceCents) > 0 &&
            Number(product.discountedPriceCents) < Number(product.priceCents);

          const displayPrice = hasDiscount
            ? Number(product.discountedPriceCents)
            : Number(product.priceCents);

          return (
            <Link
              key={product.id}
              href={`/products/${encodeURIComponent(product.slug)}`}
              onClick={closeSearch}
              className="group flex items-center gap-3 px-4 py-3 transition hover:bg-[#faf9f7] max-[650px]:px-4"
            >
              <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-[#f5f2ed] max-[650px]:h-[80px] max-[650px]:w-[80px]">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="80px"
                    unoptimized
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <Package size={22} className="text-[#c4bdb4]" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-[12px] font-bold text-[#34332e] max-[650px]:text-[13px]">
                  {product.name}
                </p>

                <p className="mt-1 line-clamp-1 text-[10px] text-[#99918a]">
                  {[product.category, product.cut].filter(Boolean).join(' · ') || 'Fresh meat'}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold text-[#e86b3e]">
                    {formatPrice(displayPrice)}
                  </span>

                  {hasDiscount && (
                    <span className="text-[10px] text-[#a49c94] line-through">
                      {formatPrice(product.priceCents)}
                    </span>
                  )}

                  {product.unit && (
                    <span className="text-[10px] text-[#99918a]">/ {product.unit}</span>
                  )}
                </div>
              </div>

              <ArrowRight
                size={17}
                className="shrink-0 text-[#c7c0b8] transition group-hover:translate-x-1 group-hover:text-[#e86b3e]"
              />
            </Link>
          );
        })}
      </div>
    );
  }

  const showSearchResults = searchOpen && searchQuery.trim().length >= 2;

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

      {}
      <header className="sticky top-0 z-50 border-b border-[#efeee9] bg-white">
        <div className="relative mx-auto flex h-[76px] max-w-[1600px] items-center justify-between px-[7.1%] max-[900px]:px-[5%] max-[650px]:h-[65px]">
          {}
          <Link
            href="/"
            onClick={() => {
              closeMenus();
              closeSearch();
            }}
            className="flex shrink-0 items-center gap-2 max-[650px]:transition-opacity"
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
            {user && <NotificationBell />}

            {}
            <div
              ref={desktopSearchRef}
              className={`relative hidden items-center transition-all duration-300 ease-out min-[651px]:flex ${
                searchOpen ? 'w-[280px]' : 'w-[34px]'
              }`}
            >
              <div className="flex h-10 w-full items-center overflow-hidden rounded-full border border-transparent bg-transparent transition-all duration-300 focus-within:border-[#eee9e3] focus-within:bg-[#faf9f7]">
                <button
                  type="button"
                  onClick={() => {
                    if (searchOpen) {
                      desktopInputRef.current?.focus();
                    } else {
                      openSearch();
                    }
                  }}
                  aria-label="Search products"
                  className="grid h-9 w-9 shrink-0 place-items-center text-[#484741] transition hover:text-[#e86b3e]"
                >
                  <Search size={18} />
                </button>

                <input
                  ref={desktopInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search products..."
                  tabIndex={searchOpen ? 0 : -1}
                  className={`h-full min-w-0 flex-1 bg-transparent pr-2 text-[12px] text-[#34332e] outline-none placeholder:text-[#aaa39b] transition-opacity duration-200 ${
                    searchOpen ? 'w-full opacity-100' : 'w-0 opacity-0'
                  }`}
                />

                {searchOpen && (
                  <button
                    type="button"
                    onClick={closeSearch}
                    aria-label="Close search"
                    className="mr-2 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#99918a] transition hover:bg-[#eeeae4] hover:text-[#e86b3e]"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {}
              {showSearchResults && (
                <div className="absolute right-0 top-[calc(100%+12px)] z-[100] w-[390px] overflow-hidden rounded-2xl border border-[#eeece7] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.14)]">
                  <div className="flex items-center justify-between border-b border-[#efeee9] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#99918a]">
                      Matching products
                    </p>

                    {!searchLoading && (
                      <span className="text-[10px] text-[#99918a]">{searchTotal} results</span>
                    )}
                  </div>

                  <div className="max-h-[430px] overflow-y-auto">{renderSearchResults()}</div>

                  {searchTotal > 0 && (
                    <Link
                      href={`/shop?search=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={closeSearch}
                      className="flex items-center justify-center gap-2 border-t border-[#efeee9] px-4 py-3 text-[11px] font-semibold text-[#e86b3e] transition hover:bg-[#faf9f7]"
                    >
                      View all results
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              )}
            </div>

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
              onClick={openSearch}
              aria-label="Search products"
              className="hidden text-[#484741] transition hover:text-[#e86b3e] max-[650px]:grid"
            >
              <Search size={19} />
            </button>

            {}
            <button
              type="button"
              onClick={() => {
                closeSearch();
                setMenuOpen((open) => !open);
              }}
              className="hidden text-[#34332e] max-[900px]:grid"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>

          {}
          {searchOpen && (
            <div className="absolute inset-0 z-[120] hidden h-full items-center gap-3 bg-white px-[5%] max-[650px]:flex">
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className="grid h-9 w-8 shrink-0 place-items-center text-[#e86b3e]"
              >
                <X size={23} />
              </button>

              <input
                ref={mobileInputRef}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products..."
                autoComplete="off"
                className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[#34332e] outline-none placeholder:text-[#aaa39b]"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    mobileInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="grid h-8 w-8 shrink-0 place-items-center text-[#99918a]"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {}
        {showSearchResults && (
          <div className="absolute left-0 right-0 top-full z-[110] hidden bg-white max-[650px]:block">
            <div className="h-[calc(100dvh-65px)] w-full overflow-y-auto overscroll-contain border-t border-[#efeee9] bg-white shadow-[0_15px_35px_rgba(0,0,0,0.10)]">
              <div className="flex items-center justify-between border-b border-[#efeee9] px-4 py-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#99918a]">
                  Matching products
                </p>

                {!searchLoading && (
                  <span className="text-[10px] text-[#99918a]">{searchTotal} results</span>
                )}
              </div>

              {renderSearchResults()}

              {searchTotal > 0 && (
                <Link
                  href={`/shop?search=${encodeURIComponent(searchQuery.trim())}`}
                  onClick={closeSearch}
                  className="flex items-center justify-center gap-2 border-t border-[#efeee9] px-4 py-4 text-[11px] font-semibold text-[#e86b3e]"
                >
                  View all results
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        )}

        {}
        {menuOpen && (
          <div className="absolute left-0 right-0 top-full z-50 max-h-[calc(100dvh-65px)] overflow-y-auto border-t border-[#efeee9] bg-white px-[5%] pb-6 pt-5 shadow-[0_15px_30px_rgba(0,0,0,0.08)] min-[901px]:hidden">
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
