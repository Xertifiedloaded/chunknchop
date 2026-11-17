'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Heart, Minus, Plus } from 'lucide-react';
import type { CatalogProduct } from '@/lib/catalog';
import { formatPrice } from '@/lib/catalog';
import { useCart } from '@/components/cart/cart-provider';

export default function ProductDetail({ product }: { product: CatalogProduct }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const { addProduct, cartCount, error: cartError } = useCart();

  function addToBag() {
    addProduct(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-360 bg-[#f8f8f6] px-[7.1%] text-[#24231f] max-[650px]:px-[5%]">
      <div className="flex flex-wrap items-center gap-[9px] py-[18px] text-[9px] text-[#88847d]">
        <Link href="/" className="transition-colors hover:text-[#a9442c]">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="transition-colors hover:text-[#a9442c]">
          Shop all
        </Link>
        <span>/</span>
        <span className="text-[#514f49]">{product.name}</span>
      </div>

      <section className="grid grid-cols-2 items-center gap-[7.5%] py-[35px] pb-[75px] max-[750px]:grid-cols-1 max-[750px]:gap-8 max-[650px]:py-[15px] max-[650px]:pb-[50px]">
        <div className="relative min-h-[500px] overflow-hidden bg-[#e7e3db] max-[750px]:min-h-0 max-[750px]:aspect-[1/1]">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 size-full object-cover"
          />

          {product.badge && (
            <span className="absolute top-[15px] left-[15px] bg-[#f8f6f0] px-[10px] py-[8px] text-[8px] font-bold tracking-[0.1em] text-[#5c5146]">
              {product.badge}
            </span>
          )}
        </div>

        <div className="py-[25px] max-[750px]:py-0">
          <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
            <span className="h-px w-[19px] bg-[#e86b3e]" />
            {product.category.toUpperCase()} · ChunknChop
          </p>

          <h1 className="mt-[17px] mb-[13px] font-heading text-[clamp(37px,4.5vw,55px)] leading-[1.02] tracking-[-0.045em]">
            {product.name}
          </h1>

          <p className="mt-0 mb-[19px] text-[17px] font-semibold text-[#a9442c]">
            {formatPrice(product.priceCents)}
            <small className="ml-[5px] text-[10px] font-normal text-[#88847d]">
              {` / ${product.unit}`}
            </small>
          </p>

          <p className="mb-[25px] max-w-[420px] text-[12px] leading-[1.9] text-[#77736d]">
            {product.description}
          </p>

          <div className="h-px w-full bg-[#e6e4de]" />

          <div className="flex items-center justify-between gap-4 border-b border-[#e6e4de] py-[17px]">
            <span className="text-[9px] font-bold tracking-[0.12em] text-[#77736d]">YOUR CUT</span>
            <strong className="text-right text-[11px] font-semibold">{product.cut}</strong>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-[#e6e4de] py-[17px]">
            <span className="text-[9px] font-bold tracking-[0.12em] text-[#77736d]">QUANTITY</span>

            <div className="flex h-[36px] items-center border border-[#dedbd3]">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Decrease quantity"
                className="grid size-[35px] place-items-center text-[#514f49] transition-colors hover:bg-[#eeeae2] hover:text-[#a9442c]"
              >
                <Minus size={15} />
              </button>

              <strong className="min-w-[32px] text-center text-[11px] font-semibold">
                {quantity}
              </strong>

              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                aria-label="Increase quantity"
                disabled={quantity >= 99}
                className="grid size-[35px] place-items-center text-[#514f49] transition-colors hover:bg-[#eeeae2] hover:text-[#a9442c] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <div className="mt-[22px] flex items-stretch gap-[10px]">
            <button
              type="button"
              className={`flex min-h-[49px] flex-1 items-center justify-center gap-[12px] px-[15px] text-[9px] font-bold tracking-[0.1em] transition-colors duration-200 ${
                added ? 'bg-[#53623f] text-white' : 'bg-[#292721] text-white hover:bg-[#a9442c]'
              }`}
              onClick={addToBag}
            >
              {added ? (
                <>
                  <Check size={17} />
                  ADDED TO BAG
                </>
              ) : (
                <>
                  ADD TO BAG · {formatPrice(product.priceCents * quantity)}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              className={`grid size-[49px] shrink-0 place-items-center border transition-colors duration-200 ${
                favorite
                  ? 'border-[#a9442c] bg-[#a9442c] text-white'
                  : 'border-[#dedbd3] bg-transparent text-[#514f49] hover:border-[#a9442c] hover:text-[#a9442c]'
              }`}
              onClick={() => setFavorite(!favorite)}
              aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={favorite}
            >
              <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          {cartError && (
            <p className="mt-[12px] text-[10px] leading-[1.6] text-[#a9442c]" role="alert">
              {cartError}
            </p>
          )}

          <div className="mt-[27px] flex items-start gap-[15px] border-t border-[#e6e4de] pt-[18px]">
            <span className="shrink-0 text-[8px] font-bold tracking-[0.1em] text-[#77736d]">
              PRODUCT INFORMATION
            </span>

            <div className="flex flex-col gap-[5px] text-right">
              <strong className="text-[10px] font-semibold">Availability and details</strong>
              <span className="text-[9px] leading-[1.6] text-[#88847d]">
                Product information is provided by ChunknChop.
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-[15px] border-t border-[#e6e4de] py-[20px] text-[8px] font-bold tracking-[0.12em] text-[#77736d]">
        <Link
          href="/shop"
          className="inline-flex items-center gap-[9px] transition-colors hover:text-[#a9442c]"
        >
          <ArrowLeft size={14} />
          BACK TO THE COUNTER
        </Link>

        <span>ChunknChop · GOOD MEAT. GOOD LIVING.</span>
      </footer>
    </main>
  );
}
