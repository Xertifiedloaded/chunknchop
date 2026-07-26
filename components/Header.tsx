'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  User,
  ShoppingBag,
  Menu,
  X,
  Minus,
  Plus,
  Trash2,
  LogOut,
  Package,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import logo from '../assets/header-logo.svg';
import { useAuthStore } from '@/lib/store/authStore';
import { useCartStore } from '@/lib/store/cartStore';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Categories', href: '/categories' },
  { label: 'Wholesale', href: '/wholesale' },
  { label: 'Recipes', href: '/recipes' },
  { label: 'Contact', href: '/contact' },
  { label: 'Shop', href: '/shop' },
];

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export default function Header() {
  const router = useRouter();
  const { user, accessToken, logout } = useAuthStore();

  const {
    items: cartItems,
    setItems: setCartItems,
    getTotalPrice,
    isLoading: cartLoading,
    setLoading: setCartLoading,
  } = useCartStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const isSupplier = user?.role === 'SUPPLIER';
  const isAdmin = user?.role === 'ADMIN';

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = getTotalPrice();

  const fetchCart = useCallback(async () => {
    if (!accessToken || isSupplier) return;
    try {
      setCartLoading(true);
      const res = await fetch('/api/customer/cart', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.cartItems || []);
      }
    } catch (error) {
      console.error('[cart] failed to fetch cart:', error);
    } finally {
      setCartLoading(false);
    }
  }, [accessToken, isSupplier, setCartItems, setCartLoading]);

  useEffect(() => {
    if (user && !isSupplier) fetchCart();
    else setCartItems([]);
  }, [user, isSupplier, fetchCart, setCartItems]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setCartOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    if (cartOpen || accountOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [cartOpen, accountOpen]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      logout();
      setAccountOpen(false);
      setMenuOpen(false);
      setCartItems([]);
      router.push('/');
    }
  }

  async function handleRemoveItem(cartItemId: string) {
    const prev = cartItems;
    setCartItems(cartItems.filter((i) => i.id !== cartItemId));
    try {
      const res = await fetch(`/api/customer/cart/${cartItemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to remove');
      toast.success('Item removed');
    } catch (error) {
      console.error('[cart] failed to remove item:', error);
      setCartItems(prev);
      toast.error('Failed to remove item');
    }
  }

  async function handleUpdateQuantity(cartItemId: string, newQuantity: number) {
    if (newQuantity < 1) return;
    const item = cartItems.find((i) => i.id === cartItemId);
    if (!item) return;

    const prev = cartItems;
    setCartItems(cartItems.map((i) => (i.id === cartItemId ? { ...i, quantity: newQuantity } : i)));
    setUpdatingId(cartItemId);

    try {
      const res = await fetch('/api/customer/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId: item.productId,
          quantity: newQuantity,
          selectedTier: item.selectedTier,
          selectedVariants: item.selectedVariants,
        }),
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch (error) {
      console.error('[cart] failed to update quantity:', error);
      setCartItems(prev);
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <header className="bg-brand-foreground relative z-50 w-full border-b border-neutral-100">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            width={140}
            height={70}
            className="h-8 w-auto object-contain sm:h-9"
            src={logo}
            alt="ChunkNChop Logo"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {!isSupplier &&
            NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-charcoal text-sm transition-colors hover:text-neutral-900"
              >
                {link.label}
              </Link>
            ))}

          {isSupplier && (
            <Link
              href="/supplier/dashboard"
              className="text-charcoal flex items-center gap-2 text-sm transition-colors hover:text-neutral-900"
            >
              <Package size={16} strokeWidth={1.8} />
              Dashboard
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className="text-charcoal text-sm transition-colors hover:text-neutral-900"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4 sm:gap-6">
          {!isSupplier && (
            <button
              aria-label={searchOpen ? 'Close search' : 'Search'}
              onClick={() => {
                setSearchOpen((v) => !v);
                setCartOpen(false);
                setAccountOpen(false);
              }}
              className="text-neutral-500 transition-colors hover:text-neutral-900"
            >
              {searchOpen ? (
                <X size={20} strokeWidth={1.8} />
              ) : (
                <Search size={20} strokeWidth={1.8} />
              )}
            </button>
          )}

          <div className="relative z-50 hidden sm:block" ref={accountRef}>
            {user ? (
              <>
                <button
                  aria-label="Account"
                  onClick={() => {
                    setAccountOpen((v) => !v);
                    setCartOpen(false);
                    setSearchOpen(false);
                  }}
                  className="text-neutral-500 transition-colors hover:text-neutral-900"
                >
                  <User size={20} strokeWidth={1.8} />
                </button>

                <div
                  className={`absolute right-0 z-50 mt-3 w-52 rounded-lg border border-neutral-100 bg-white shadow-lg transition-all duration-150 ${
                    accountOpen
                      ? 'visible translate-y-0 opacity-100'
                      : 'pointer-events-none -translate-y-1 opacity-0'
                  }`}
                >
                  <div className="truncate border-b border-neutral-100 px-4 py-2.5 text-xs text-neutral-400">
                    {user.email}
                  </div>

                  {!isSupplier && (
                    <>
                      <Link
                        href="/orders"
                        onClick={() => setAccountOpen(false)}
                        className="text-charcoal block px-4 py-2.5 text-sm hover:bg-neutral-50"
                      >
                        Orders
                      </Link>
                      <Link
                        href="/account/subscriptions"
                        onClick={() => setAccountOpen(false)}
                        className="text-charcoal block px-4 py-2.5 text-sm hover:bg-neutral-50"
                      >
                        Subscriptions
                      </Link>
                      <Link
                        href="/account/wholesale"
                        onClick={() => setAccountOpen(false)}
                        className="text-charcoal block px-4 py-2.5 text-sm hover:bg-neutral-50"
                      >
                        Wholesale
                      </Link>
                      <Link
                        href="/account/support"
                        onClick={() => setAccountOpen(false)}
                        className="text-charcoal block px-4 py-2.5 text-sm hover:bg-neutral-50"
                      >
                        Support
                      </Link>
                    </>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 border-t border-neutral-100 px-4 py-2.5 text-left text-sm text-red-500 hover:bg-neutral-50"
                  >
                    <LogOut size={14} strokeWidth={1.8} />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-charcoal text-sm transition-colors hover:text-neutral-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-[#E86B3E] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#c8692f]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {!isSupplier && (
            <button
              aria-label="Cart"
              onClick={() => {
                setCartOpen((v) => !v);
                setSearchOpen(false);
                setAccountOpen(false);
                if (!cartOpen) fetchCart();
              }}
              className="relative text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <ShoppingBag size={20} strokeWidth={1.8} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#e07a3f] text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          <button
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="text-charcoal transition-colors hover:text-neutral-900 lg:hidden"
          >
            {menuOpen ? <X size={22} strokeWidth={1.8} /> : <Menu size={22} strokeWidth={1.8} />}
          </button>
        </div>
      </div>

      {!isSupplier && (
        <div
          className={`relative z-50 overflow-hidden border-t border-neutral-100 transition-all duration-300 ease-in-out ${
            searchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3 lg:px-10"
          >
            <Search size={18} className="shrink-0 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for beef, chicken, suya packs..."
              className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="hover:text-charcoal text-neutral-400"
              >
                <X size={16} />
              </button>
            )}
          </form>
        </div>
      )}

      {!isSupplier && (
        <div
          ref={cartRef}
          className={`relative z-50 overflow-hidden border-t border-neutral-100 shadow-lg transition-all duration-300 ease-in-out ${
            cartOpen ? 'max-h-175 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="mx-auto max-w-7xl px-6 py-5 lg:px-10">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#2D2D2D]">
                Your order ({cartCount} {cartCount === 1 ? 'item' : 'items'})
              </p>
              <button
                aria-label="Close cart"
                onClick={() => setCartOpen(false)}
                className="hover:text-charcoal text-neutral-400"
              >
                <X size={16} />
              </button>
            </div>

            {cartLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              </div>
            ) : cartItems.length === 0 ? (
              <p className="mt-6 pb-2 text-center text-sm text-neutral-400">Your cart is empty.</p>
            ) : (
              <div className="mt-4 flex max-h-96 flex-col gap-3 overflow-y-auto pr-1 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {cartItems.map((item) => {
                  const tierPrice = item.selectedTier
                    ? item.product.tiers.find((t) => t.name === item.selectedTier)?.price
                    : undefined;
                  const itemPrice = tierPrice ?? item.product.basePrice;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl bg-[#F7F5F4] p-3"
                    >
                      {item.product.images?.[0] ? (
                        <img
                          loading="lazy"
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 shrink-0 rounded-lg bg-linear-to-br from-[#e8a68a] to-[#b5502e]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#2D2D2D]">
                          {item.product.name}
                        </p>
                        {item.selectedTier && (
                          <p className="truncate text-xs text-neutral-400">{item.selectedTier}</p>
                        )}
                        <p className="text-xs text-neutral-400">{formatNaira(itemPrice)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          aria-label={`Decrease ${item.product.name}`}
                          disabled={updatingId === item.id}
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-4 text-center text-xs font-semibold text-[#2D2D2D]">
                          {item.quantity}
                        </span>
                        <button
                          aria-label={`Increase ${item.product.name}`}
                          disabled={updatingId === item.id}
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        aria-label={`Remove ${item.product.name}`}
                        onClick={() => handleRemoveItem(item.id)}
                        className="shrink-0 text-neutral-300 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {!cartLoading && cartItems.length > 0 && (
              <div className="mt-5 flex flex-col items-stretch gap-3 border-t border-neutral-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                  <span className="text-sm text-neutral-500">Subtotal</span>
                  <span className="text-base font-bold text-[#2D2D2D]">
                    {formatNaira(cartTotal)}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="w-full rounded-md bg-[#E86B3E] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#c8692f] sm:w-auto sm:px-8"
                >
                  Checkout
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className={`relative z-50 overflow-hidden border-t border-neutral-100 transition-all duration-300 ease-in-out lg:hidden ${
          menuOpen ? 'max-h-128 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-1 px-6 py-4">
          {!isSupplier &&
            NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-charcoal rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900"
              >
                {link.label}
              </Link>
            ))}

          {isSupplier && (
            <Link
              href="/supplier/dashboard"
              onClick={() => setMenuOpen(false)}
              className="text-charcoal rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            >
              Dashboard
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="text-charcoal rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            >
              Admin
            </Link>
          )}

          {!isSupplier && user && (
            <button
              onClick={() => {
                setMenuOpen(false);
                setCartOpen(true);
                fetchCart();
              }}
              className="text-charcoal flex items-center gap-2 rounded-md px-2 py-2.5 text-left text-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            >
              <ShoppingBag size={16} strokeWidth={1.8} />
              Cart ({cartCount})
            </button>
          )}

          {user ? (
            <>
              {!isSupplier && (
                <>
                  <Link
                    href="/account/subscriptions"
                    onClick={() => setMenuOpen(false)}
                    className="text-charcoal rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                  >
                    Subscriptions
                  </Link>
                  <Link
                    href="/account/wholesale"
                    onClick={() => setMenuOpen(false)}
                    className="text-charcoal rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                  >
                    Wholesale
                  </Link>
                  <Link
                    href="/account/support"
                    onClick={() => setMenuOpen(false)}
                    className="text-charcoal rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                  >
                    Support
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="mt-1 flex items-center gap-2 rounded-md border-t border-neutral-100 px-2 pt-3 text-left text-sm text-red-500 transition-colors hover:text-red-600"
              >
                <LogOut size={18} strokeWidth={1.8} />
                Logout
              </button>
            </>
          ) : (
            <div className="mt-1 flex flex-col gap-1 border-t border-neutral-100 pt-3">
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="text-charcoal rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMenuOpen(false)}
                className="text-charcoal rounded-md px-2 py-2.5 text-sm transition-colors hover:bg-neutral-50 hover:text-neutral-900"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
