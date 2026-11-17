'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Truck,
} from 'lucide-react';

import { useCart } from '@/components/cart/cart-provider';
import { formatPrice } from '@/lib/catalog';
import EmptyCart, { LoadingState } from './EmptyCart.tsx';

const container = 'mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-10 xl:px-12';

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

  const checkoutHref = isSignedIn ? '/checkout' : '/sign-in?returnTo=/checkout';

  return (
    <main className="flex min-h-screen flex-col bg-[#f8f8f6] text-[#24231f]">
      <section className={`${container} flex-1 py-8 sm:py-10 lg:py-14`}>
        <div className="mb-8 sm:mb-9 lg:mb-11">
          <p className="mb-3 flex items-center gap-2.5 font-worksans text-[9px] font-bold tracking-[0.16em] text-[#77736d] sm:text-[10px]">
            <span className="h-px w-5 bg-brand" />
            YOUR SELECTION
          </p>

          <h1 className="m-0 font-heading text-[clamp(34px,5vw,48px)] leading-[1.05] font-semibold tracking-tight">
            Your <em className="font-normal text-brand">cart.</em>
          </h1>

          <p className="mt-3 max-w-xl text-xs leading-6 text-[#77736d] sm:text-[13px]">
            {isSignedIn
              ? 'Your cart is saved to your ChunknChop account.'
              : 'Sign in to save your cart to your account. Guest items stay in memory only and aren’t stored in your browser.'}
          </p>
        </div>

        {error && (
          <div
            className="mb-5 flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-xs text-red-700"
            role="alert"
          >
            <span className="font-semibold">!</span>
            <p className="m-0">{error}</p>
          </div>
        )}

        {}
        {isLoading ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyCart />
        ) : (
          
          <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-9 xl:grid-cols-[minmax(0,1fr)_350px] xl:gap-12">
            {}
            <div className="min-w-0">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="m-0 font-heading text-base font-semibold sm:text-lg">
                  Shopping bag
                </h2>

                <span className="text-[9px] font-medium tracking-wide text-[#88847d]">
                  {cartCount} {cartCount === 1 ? 'ITEM' : 'ITEMS'}
                </span>
              </div>

              <div className="border-y border-[#e6e4de]">
                {items.map(({ product, quantity }) => (
                  <article
                    key={product.slug}
                    className="grid grid-cols-[84px_minmax(0,1fr)] gap-3.5 border-b border-[#e6e4de] py-4 last:border-b-0 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:gap-5 sm:py-6 lg:grid-cols-[125px_minmax(0,1fr)_auto] lg:gap-6"
                  >
                    {}
                    <Link
                      href={`/products/${product.slug}`}
                      className="group relative aspect-[4/5] overflow-hidden bg-[#eeece7]"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    {}
                    <div className="flex min-w-0 flex-col justify-between gap-3">
                      <div>
                        <span className="text-[9px] font-bold tracking-[0.14em] text-brand">
                          {product.category.toUpperCase()}
                        </span>

                        <h3 className="mt-1.5 mb-0 font-heading text-sm leading-snug font-semibold capitalize break-words sm:text-base">
                          <Link
                            href={`/products/${product.slug}`}
                            className="transition-colors hover:text-brand"
                          >
                            {product.name}
                          </Link>
                        </h3>

                        <p className="mt-1 mb-0 text-[10px] leading-5 text-[#88847d] sm:text-[11px]">
                          {product.cut}
                        </p>

                        <p className="mt-1.5 mb-0 text-[10px] font-medium text-[#77736d] sm:text-[11px]">
                          {formatPrice(product.priceCents)}
                          <span className="text-[#aaa69f]"> / unit</span>
                        </p>
                      </div>

                      {}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex h-9 items-center border border-[#e6e4de] bg-white">
                          <button
                            type="button"
                            onClick={() => setQuantity(product.slug, quantity - 1)}
                            aria-label={`Decrease ${product.name} quantity`}
                            className="flex h-full w-8 items-center justify-center text-[#77736d] transition-colors hover:bg-[#f3eee8] hover:text-brand"
                          >
                            <Minus size={12} />
                          </button>

                          <span className="flex h-full min-w-8 items-center justify-center border-x border-[#e6e4de] text-[11px] font-semibold tabular-nums">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => setQuantity(product.slug, quantity + 1)}
                            disabled={quantity >= 99}
                            aria-label={`Increase ${product.name} quantity`}
                            className="flex h-full w-8 items-center justify-center text-[#77736d] transition-colors hover:bg-[#f3eee8] hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {}
                        <button
                          type="button"
                          onClick={() => removeProduct(product.slug)}
                          aria-label={`Remove ${product.name}`}
                          className="inline-flex h-9 items-center gap-1.5 text-[9px] font-semibold tracking-wide text-[#99958e] transition-colors hover:text-brand sm:hidden"
                        >
                          <Trash2 size={13} />
                          REMOVE
                        </button>
                      </div>
                    </div>

                    {}
                    <div className="col-span-2 flex items-center justify-between border-t border-[#f0eee9] pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-between sm:border-0 sm:pt-0">
                      <strong className="text-[13px] font-semibold whitespace-nowrap tabular-nums sm:text-sm">
                        {formatPrice(product.priceCents * quantity)}
                      </strong>

                      <button
                        type="button"
                        onClick={() => removeProduct(product.slug)}
                        aria-label={`Remove ${product.name}`}
                        className="hidden h-8 w-8 items-center justify-center text-[#aaa69f] transition-colors hover:bg-red-50 hover:text-red-600 sm:inline-flex"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <Link
                href="/shop"
                className="group mt-5 inline-flex items-center gap-2 text-[9px] font-bold tracking-[0.13em] text-[#77736d] transition-colors hover:text-brand sm:text-[10px]"
              >
                <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1" />
                CONTINUE SHOPPING
              </Link>
            </div>

            {}
            <aside className="lg:sticky lg:top-24">
              <div className="border border-[#e6e4de] bg-white p-5 sm:p-6">
                <p className="mt-0 mb-5 font-worksans text-[9px] font-bold tracking-[0.16em] text-[#77736d] sm:text-[10px]">
                  ORDER SUMMARY
                </p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-[#77736d]">Subtotal ({cartCount} items)</span>

                    <strong className="font-semibold tabular-nums">
                      {formatPrice(subtotalCents)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-[#77736d]">Delivery and taxes</span>

                    <span className="text-[10px] font-medium text-[#88847d]">Confirmed later</span>
                  </div>
                </div>

                <div className="my-5 border-t border-[#e6e4de]" />

                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-[#514f49]">Estimated subtotal</span>

                  <strong className="font-heading text-lg font-semibold tabular-nums sm:text-xl">
                    {formatPrice(subtotalCents)}
                  </strong>
                </div>

                <Link
                  href={checkoutHref}
                  className="group mt-6 flex min-h-[48px] w-full items-center justify-center gap-3 bg-brand px-4 py-3 text-center text-[9px] font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#a9442c] sm:text-[10px]"
                >
                  {isSignedIn ? 'CONTINUE TO CHECKOUT' : 'SIGN IN TO CHECK OUT'}

                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>

                <p className="mt-4 mb-0 text-center text-[9px] leading-5 text-[#99958e]">
                  Payment is arranged after we receive your order request.
                </p>
              </div>

              {}
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2 border border-[#e6e4de] bg-white p-3">
                  <ShieldCheck size={15} className="shrink-0 text-brand" />
                  <span className="text-[8px] font-semibold leading-4 text-[#77736d] sm:text-[9px]">
                    QUALITY ASSURED
                  </span>
                </div>

                <div className="flex items-center gap-2 border border-[#e6e4de] bg-white p-3">
                  <Truck size={15} className="shrink-0 text-brand" />
                  <span className="text-[8px] font-semibold leading-4 text-[#77736d] sm:text-[9px]">
                    DELIVERY AVAILABLE
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>

      {}
      <footer className="mt-auto border-t border-[#e6e4de]">
        <div
          className={`${container} flex flex-col items-center justify-between gap-3 py-5 text-center sm:flex-row sm:py-6`}
        >
          <Link href="/" className="font-heading text-xs font-bold tracking-wide text-[#24231f]">
            ChunknChop
          </Link>

          <span className="text-[9px] font-bold tracking-[0.16em] text-[#88847d]">
            GOOD MEAT. GOOD LIVING.
          </span>

          <Link
            href="/shop"
            className="text-[9px] font-bold tracking-[0.12em] text-[#77736d] transition-colors hover:text-brand"
          >
            KEEP BROWSING
          </Link>
        </div>
      </footer>
    </main>
  );
}
