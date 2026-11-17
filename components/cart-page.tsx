'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/components/cart-provider';
import { formatPrice } from '@/lib/catalog';

const container = 'mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12';
const primaryButton =
  'flex w-full items-center justify-center gap-3 bg-brand px-5 py-4 text-center text-[11px] font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#a9442c]';

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
      <header className="border-b border-[#e6e4de]">
        <div className={`${container} grid min-h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 sm:min-h-[72px]`}>
          <Link
            href="/shop"
            aria-label="Continue shopping"
            className="inline-flex items-center gap-2 justify-self-start text-[11px] font-bold tracking-[0.12em] text-[#77736d] transition-colors hover:text-brand"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">CONTINUE SHOPPING</span>
          </Link>

          <Link
            href="/"
            className="font-heading text-lg font-bold tracking-[0.08em] text-[#24231f] sm:text-xl"
          >
            ChunknChop
          </Link>

          <span className="inline-flex items-center gap-2 justify-self-end text-[11px] font-bold tracking-[0.12em] text-[#77736d]">
            <span className="hidden sm:inline">YOUR BAG</span>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] text-white">
              {cartCount}
            </span>
          </span>
        </div>
      </header>

      <section className={`${container} flex-1 py-10 sm:py-14 lg:py-16`}>
        <div className="mb-10 max-w-2xl">
          <p className="mb-4 flex items-center gap-2.5 font-worksans text-[11px] font-bold tracking-[0.15em] text-[#77736d]">
            <span className="h-px w-5 bg-brand" />
            YOUR SELECTION
          </p>

          <h1 className="m-0 font-heading text-[clamp(38px,5vw,60px)] leading-[1] font-semibold tracking-tight text-[#24231f]">
            Your <em className="font-normal text-brand">bag.</em>
          </h1>

          <p className="mt-4 mb-0 text-sm leading-7 text-[#77736d]">
            {isSignedIn
              ? 'Your bag is saved to your ChunknChop account.'
              : 'Sign in to save your bag to your account. Guest items stay in memory only and aren’t stored in your browser.'}
          </p>
        </div>

        {error && (
          <p
            className="mb-6 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center border border-dashed border-[#e6e4de] px-5 py-12">
            <p className="m-0 text-sm text-[#88847d]">Loading your saved bag…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center border border-dashed border-[#e6e4de] px-5 py-14 text-center">
            <span className="mb-6 font-heading text-5xl font-semibold text-brand">
              C<span className="font-normal text-[#24231f]">&</span>C
            </span>

            <h2 className="m-0 font-heading text-2xl font-semibold text-[#24231f]">
              Your bag is taking a breather.
            </h2>

            <p className="mt-3 mb-0 text-sm text-[#88847d]">Find something good for the table.</p>

            <Link
              href="/shop"
              className="mt-7 inline-flex items-center gap-3 bg-brand px-7 py-4 text-[11px] font-bold tracking-[0.14em] text-white transition-colors hover:bg-[#a9442c]"
            >
              EXPLORE THE CUTS
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-12">
            <div className="divide-y divide-[#e6e4de] border-y border-[#e6e4de]">
              {items.map(({ product, quantity }) => (
                <article
                  className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-4 py-5 sm:grid-cols-[130px_minmax(0,1fr)_auto] sm:gap-x-6 sm:py-6"
                  key={product.slug}
                >
                  <Link
                    href={`/products/${product.slug}`}
                    className="block aspect-[4/5] self-start overflow-hidden bg-[#eeece7] sm:row-span-2"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </Link>

                  <div className="min-w-0 sm:col-start-2 sm:row-start-1">
                    <span className="text-[10px] font-bold tracking-[0.16em] text-brand">
                      {product.category.toUpperCase()}
                    </span>

                    <h2 className="mt-2 mb-0 font-heading text-base leading-snug font-semibold capitalize break-words text-[#24231f] sm:text-lg">
                      <Link
                        href={`/products/${product.slug}`}
                        className="transition-colors hover:text-brand"
                      >
                        {product.name}
                      </Link>
                    </h2>

                    <p className="mt-2 mb-0 text-xs leading-5 text-[#88847d]">{product.cut}</p>
                  </div>

                  <div className="col-span-2 flex items-center justify-between gap-3 sm:contents">
                    <div className="inline-flex h-10 items-center self-end border border-[#e6e4de] bg-white sm:col-start-2 sm:row-start-2 sm:justify-self-start">
                      <button
                        onClick={() => setQuantity(product.slug, quantity - 1)}
                        aria-label={`Decrease ${product.name} quantity`}
                        className="flex h-full w-10 cursor-pointer items-center justify-center border-0 bg-transparent text-[#77736d] transition-colors hover:bg-[#f3eee8] hover:text-brand"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="flex h-full min-w-10 items-center justify-center border-x border-[#e6e4de] text-xs font-semibold text-[#24231f]">
                        {quantity}
                      </span>

                      <button
                        onClick={() => setQuantity(product.slug, quantity + 1)}
                        aria-label={`Increase ${product.name} quantity`}
                        disabled={quantity >= 99}
                        className="flex h-full w-10 cursor-pointer items-center justify-center border-0 bg-transparent text-[#77736d] transition-colors hover:bg-[#f3eee8] hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:flex-col sm:items-end sm:justify-between">
                      <strong className="text-sm font-semibold whitespace-nowrap text-[#24231f]">
                        {formatPrice(product.priceCents * quantity)}
                      </strong>

                      <button
                        onClick={() => removeProduct(product.slug)}
                        aria-label={`Remove ${product.name}`}
                        className="flex h-10 w-10 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[#99958e] transition-colors hover:text-brand sm:h-auto sm:w-auto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="border border-[#e6e4de] bg-white p-5 sm:p-7 lg:sticky lg:top-8">
              <p className="mt-0 mb-6 font-worksans text-[11px] font-bold tracking-[0.15em] text-[#77736d]">
                ORDER SUMMARY
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#77736d]">Subtotal</span>
                  <strong className="font-semibold text-[#24231f]">
                    {formatPrice(subtotalCents)}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#77736d]">Delivery and taxes</span>
                  <strong className="text-xs font-medium text-[#88847d]">Confirmed later</strong>
                </div>
              </div>

              <div className="my-6 border-t border-[#e6e4de]" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-[#514f49]">Estimated subtotal</span>

                <strong className="font-heading text-xl font-semibold text-[#24231f]">
                  {formatPrice(subtotalCents)}
                </strong>
              </div>

              <Link className={`${primaryButton} mt-7`} href={checkoutHref}>
                {isSignedIn ? 'CONTINUE TO CHECKOUT' : 'SIGN IN TO CHECK OUT'}
                <ArrowRight size={15} />
              </Link>

              <small className="mt-5 block text-center text-[11px] leading-5 text-[#99958e]">
                Payment is arranged after we receive your order request.
              </small>
            </aside>
          </div>
        )}
      </section>

      <footer className="border-t border-[#e6e4de]">
        <div
          className={`${container} flex flex-col items-center justify-between gap-4 py-7 text-center sm:flex-row`}
        >
          <span className="font-heading text-sm font-bold tracking-wide text-[#24231f]">
            ChunknChop
          </span>

          <span className="text-[10px] font-bold tracking-[0.18em] text-[#88847d]">
            GOOD MEAT. GOOD LIVING.
          </span>

          <Link
            href="/shop"
            className="text-[11px] font-bold tracking-[0.12em] text-[#77736d] transition-colors hover:text-brand"
          >
            KEEP BROWSING
          </Link>
        </div>
      </footer>
    </main>
  );
}