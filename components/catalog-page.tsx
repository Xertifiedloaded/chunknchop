
'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { useCart } from '@/components/cart-provider';
import { formatPrice } from '@/lib/catalog';

export default function CartPage() {
  const {
    items,
    subtotalCents,
    cartCount,
    setQuantity,
    removeProduct,
    isSignedIn,
    isLoading,
    error,
  } = useCart();

  const checkoutHref = isSignedIn
    ? '/checkout'
    : '/sign-in?returnTo=/checkout';

  return (
    <main className="min-h-screen bg-[#fbf9f6] text-[#29241f]">
      <header className="border-b border-[#eee7dd] bg-[#fbf9f6]">
        <div className="mx-auto flex h-[76px] max-w-[1250px] items-center justify-between px-5 sm:px-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#817363] transition hover:text-[#ed5b24]"
          >
            <ArrowLeft size={16} />
            Continue shopping
          </Link>

          <Link
            href="/"
            className="font-heading text-xl font-bold tracking-wide text-[#29241f]"
          >
            ChunknChop
          </Link>

          <span className="flex items-center gap-2 text-xs font-medium text-[#817363]">
            Your bag
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ed5b24] px-1.5 text-[11px] font-semibold text-white">
              {cartCount}
            </span>
          </span>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1250px] px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8">
          <p className="mb-2 text-[10px] font-bold tracking-[0.22em] text-[#ed5b24]">
            STEP 1 OF 6
          </p>

          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Review your cuts
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#857766]">
            Everything is butchered to order. Adjust quantities before you continue.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#eee7dd] bg-white">
            <p className="text-sm text-[#857766]">Loading your bag…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8ded1] bg-white px-5 text-center">
            <ShoppingBag size={32} className="mb-5 text-[#ed5b24]" />
            <h2 className="font-heading text-2xl font-semibold">
              Your bag is empty.
            </h2>
            <p className="mt-2 text-sm text-[#857766]">
              Find something good for the table.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ed5b24] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#cf481b]"
            >
              Explore the cuts
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-7">
            <div className="overflow-hidden rounded-2xl border border-[#eee7dd] bg-white">
              <div className="hidden grid-cols-[minmax(0,1fr)_110px_120px] gap-4 border-b border-[#eee7dd] bg-[#fdfcfb] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9a8b79] sm:grid">
                <span>Your cuts</span>
                <span className="text-center">Quantity</span>
                <span className="text-right">Total</span>
              </div>

              {items.map(({ product, quantity }) => (
                <article
                  key={product.slug}
                  className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-b border-[#f0ebe5] p-4 last:border-b-0 sm:grid-cols-[100px_minmax(0,1fr)_110px_120px] sm:items-center sm:gap-5 sm:px-5 sm:py-5"
                >
                  <Link
                    href={`/products/${product.slug}`}
                    className="aspect-square overflow-hidden rounded-xl bg-[#f4f1ec]"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </Link>

                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[#ed5b24]">
                      {product.category}
                    </p>

                    <Link
                      href={`/products/${product.slug}`}
                      className="font-heading text-base font-semibold text-[#29241f] hover:text-[#ed5b24]"
                    >
                      {product.name}
                    </Link>

                    <p className="mt-1 text-xs leading-5 text-[#978875]">
                      {product.cut}
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#817363]">
                      {formatPrice(product.priceCents)} each
                    </p>

                    <div className="mt-4 inline-flex h-9 items-center overflow-hidden rounded-full border border-[#eee7dd] bg-[#fbf9f6] sm:hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity(product.slug, quantity - 1)}
                        aria-label={`Decrease ${product.name} quantity`}
                        className="flex h-full w-9 items-center justify-center text-[#817363] hover:text-[#ed5b24]"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="flex h-full min-w-9 items-center justify-center text-xs font-semibold">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(product.slug, quantity + 1)}
                        disabled={quantity >= 99}
                        aria-label={`Increase ${product.name} quantity`}
                        className="flex h-full w-9 items-center justify-center text-[#817363] hover:text-[#ed5b24] disabled:opacity-40"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="hidden justify-center sm:flex">
                    <div className="inline-flex h-9 items-center overflow-hidden rounded-full border border-[#eee7dd] bg-[#fbf9f6]">
                      <button
                        type="button"
                        onClick={() => setQuantity(product.slug, quantity - 1)}
                        aria-label={`Decrease ${product.name} quantity`}
                        className="flex h-full w-8 items-center justify-center text-[#817363] hover:text-[#ed5b24]"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="flex h-full min-w-8 items-center justify-center text-xs font-semibold">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(product.slug, quantity + 1)}
                        disabled={quantity >= 99}
                        aria-label={`Increase ${product.name} quantity`}
                        className="flex h-full w-8 items-center justify-center text-[#817363] hover:text-[#ed5b24] disabled:opacity-40"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:flex-col sm:items-end sm:gap-4">
                    <strong className="text-sm font-bold text-[#ed5b24]">
                      {formatPrice(product.priceCents * quantity)}
                    </strong>

                    <button
                      type="button"
                      onClick={() => removeProduct(product.slug)}
                      aria-label={`Remove ${product.name}`}
                      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#a69a8b] transition hover:text-red-600"
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <aside className="rounded-2xl border border-[#eee7dd] bg-white p-5 shadow-[0_8px_24px_rgba(45,35,24,0.07)] sm:p-6 lg:sticky lg:top-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold">
                  Order Summary
                </h2>
                <span className="text-[11px] text-[#978875]">
                  {cartCount} items
                </span>
              </div>

              <div className="space-y-3">
                {items.map(({ product, quantity }) => (
                  <div
                    key={product.slug}
                    className="flex items-center gap-3"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-11 w-11 rounded-lg bg-[#f4f1ec] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[#29241f]">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#978875]">
                        {quantity} × {formatPrice(product.priceCents)}
                      </p>
                    </div>
                    <strong className="shrink-0 text-xs font-medium">
                      {formatPrice(product.priceCents * quantity)}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="my-5 border-t border-[#eee7dd]" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#817363]">Products</span>
                <span className="font-medium">{formatPrice(subtotalCents)}</span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-[#817363]">Delivery</span>
                <span className="text-xs text-[#978875]">Confirmed at checkout</span>
              </div>

              <div className="my-5 border-t border-[#eee7dd]" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Estimated total</span>
                <strong className="font-heading text-2xl font-bold">
                  {formatPrice(subtotalCents)}
                </strong>
              </div>

              <Link
                href={checkoutHref}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ed5b24] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#cf481b]"
              >
                {isSignedIn ? 'Continue to checkout' : 'Sign in to check out'}
                <ArrowRight size={16} />
              </Link>

              <p className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] leading-5 text-[#9a8b79]">
                <ShieldCheck size={13} />
                Secure checkout · Freshness guaranteed
              </p>
            </aside>
          </div>
        )}
      </section>

      <footer className="border-t border-[#eee7dd] px-5 py-7">
        <div className="mx-auto flex max-w-[1250px] flex-col items-center justify-between gap-3 text-center sm:flex-row">
          <span className="font-heading text-sm font-bold">ChunknChop</span>
          <span className="text-[9px] font-bold tracking-[0.18em] text-[#978875]">
            GOOD MEAT. GOOD LIVING.
          </span>
          <Link
            href="/shop"
            className="text-[10px] font-semibold uppercase tracking-wider text-[#817363] hover:text-[#ed5b24]"
          >
            Keep browsing
          </Link>
        </div>
      </footer>
    </main>
  );
}
