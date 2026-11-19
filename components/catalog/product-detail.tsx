
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
} from 'lucide-react';

import type { CatalogProduct } from '@/lib/catalog';
import { formatPrice } from '@/lib/catalog';
import { useCart } from '@/components/cart/cart-provider';

export default function ProductDetail({
  product,
}: {
  product: CatalogProduct;
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [favorite, setFavorite] = useState(false);

  const { addProduct, error: cartError } = useCart();

  function addToBag() {
    addProduct(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-360 bg-[#f8f8f6] px-[7.1%] text-[#24231f] max-[650px]:px-[5%]">

      {}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#eae8e2] py-5 text-[10px] text-[#88847d]">
        <Link
          href="/"
          className="transition-colors hover:text-brand"
        >
          Home
        </Link>

        <span>/</span>

        <Link
          href="/shop"
          className="transition-colors hover:text-brand"
        >
          Shop all
        </Link>

        <span>/</span>

        <span className="max-w-55 truncate font-medium text-[#514f49]">
          {product.name}
        </span>
      </div>

      {}
      <section className="grid grid-cols-2 items-start gap-[7%] py-10 pb-20 max-[750px]:grid-cols-1 max-[750px]:gap-9 max-[650px]:py-6 max-[650px]:pb-12">

        {}
        <div className="relative w-full self-start overflow-hidden rounded-sm bg-[#e7e3db] aspect-4/5 max-[750px]:aspect-square">

          <img
            src={product.imageUrl}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.035]"
          />

          {product.badge && (
            <span className="absolute left-5 top-5 rounded-sm bg-[#f8f6f0] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#5c5146] shadow-sm">
              {product.badge}
            </span>
          )}
        </div>

        {}
        <div className="w-full self-start pt-0">

          <p className="m-0 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#77736d]">
            <span className="h-px w-6 bg-[#e86b3e]" />
            {product.category} · ChunknChop
          </p>

          <h1 className="mt-5 mb-4 font-heading text-[clamp(34px,4vw,56px)] leading-[1.06] tracking-[-0.045em] text-[#292721]">
            {product.name}
          </h1>

          <div className="mb-5 flex flex-wrap items-baseline gap-2">
            <p className="m-0 text-[23px] font-semibold tracking-tight text-brand">
              {formatPrice(product.priceCents)}
            </p>

            <span className="text-[11px] text-[#88847d]">
              / {product.unit}
            </span>
          </div>

          <p className="mb-7 max-w-112.5 text-[13px] leading-[1.9] text-[#77736d]">
            {product.description}
          </p>

          {}
          {product.productType === 'meatbox' &&
            product.bundleItems?.length ? (
              <div className="mb-7 rounded-xl border border-[#e6e4de] bg-white p-5">

                <div className="mb-4 flex items-center justify-between">
                  <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#77736d]">
                    Inside this meatbox
                  </p>

                  <span className="rounded-full bg-[#f6eee6] px-3 py-1 text-[9px] font-semibold text-[#8f5738]">
                    {product.bundleItems.length} items
                  </span>
                </div>

                <ul className="grid gap-2 sm:grid-cols-2">
                  {product.bundleItems.map((item, index) => (
                    <li
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-lg bg-[#faf8f4] px-3 py-3"
                    >
                      <span className="text-[11px] font-medium text-[#39312b]">
                        {item.name}
                      </span>

                      <span className="shrink-0 rounded-full bg-[#f1e7dc] px-2.5 py-1 text-[10px] font-bold text-[#8f5738]">
                        × {item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

          {}
          <div className="border-t border-[#e6e4de]">

            <div className="flex items-center justify-between gap-4 border-b border-[#e6e4de] py-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#77736d]">
                Your cut
              </span>

              <strong className="text-right text-[12px] font-semibold text-[#39312b]">
                {product.cut}
              </strong>
            </div>

            {}
            <div className="flex items-center justify-between gap-4 border-b border-[#e6e4de] py-5">

              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#77736d]">
                Quantity
              </span>

              <div className="flex h-10 items-center overflow-hidden rounded-sm border border-[#dedbd3] bg-white">

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.max(1, value - 1))
                  }
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  className="grid size-10 place-items-center text-[#514f49] transition-colors hover:bg-[#f4f0e9] hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus size={14} />
                </button>

                <strong className="min-w-10 text-center text-[12px] font-semibold">
                  {quantity}
                </strong>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.min(99, value + 1))
                  }
                  aria-label="Increase quantity"
                  disabled={quantity >= 99}
                  className="grid size-10 place-items-center text-[#514f49] transition-colors hover:bg-[#f4f0e9] hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>

              </div>
            </div>
          </div>

          {}
          <div className="mt-7 flex items-stretch gap-3">

            <button
              type="button"
              onClick={addToBag}
              className={`flex min-h-13.5 flex-1 items-center justify-center gap-3 rounded-sm px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition-all duration-200 ${
                added
                  ? 'bg-[#53623f]'
                  : 'bg-[#292721] hover:bg-brand'
              }`}
            >
              {added ? (
                <>
                  <Check size={17} />
                  Added to bag
                </>
              ) : (
                <>
                  Add to bag · {formatPrice(product.priceCents * quantity)}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFavorite((value) => !value)}
              aria-label={
                favorite ? 'Remove from favorites' : 'Add to favorites'
              }
              aria-pressed={favorite}
              className={`grid size-13.5 shrink-0 place-items-center rounded-sm border transition-all duration-200 ${
                favorite
                  ? 'border-brand bg-brand text-white'
                  : 'border-[#dedbd3] bg-white text-[#514f49] hover:border-brand hover:text-brand'
              }`}
            >
              <Heart
                size={19}
                fill={favorite ? 'currentColor' : 'none'}
              />
            </button>

          </div>

          {cartError && (
            <p
              className="mt-3 text-[11px] leading-relaxed text-brand"
              role="alert"
            >
              {cartError}
            </p>
          )}

          {}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[#e6e4de] pt-6">

            <div className="flex items-start gap-3">
              <ShieldCheck
                size={19}
                className="shrink-0 text-[#8b765d]"
              />

              <div>
                <p className="m-0 text-[10px] font-bold text-[#39312b]">
                  Quality assured
                </p>

                <p className="mt-1 text-[9px] leading-relaxed text-[#88847d]">
                  Carefully selected products.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Truck
                size={19}
                className="shrink-0 text-[#8b765d]"
              />

              <div>
                <p className="m-0 text-[10px] font-bold text-[#39312b]">
                  Delivery available
                </p>

                <p className="mt-1 text-[9px] leading-relaxed text-[#88847d]">
                  Delivery details at checkout.
                </p>
              </div>
            </div>

          </div>

          {}
          <div className="mt-7 flex items-start justify-between gap-4 border-t border-[#e6e4de] pt-5">

            <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.12em] text-[#77736d]">
              Product information
            </span>

            <div className="text-right">
              <strong className="text-[10px] font-semibold text-[#39312b]">
                Availability and details
              </strong>

              <p className="mt-1 text-[9px] leading-relaxed text-[#88847d]">
                Product information is provided by ChunknChop.
              </p>
            </div>

          </div>

        </div>
      </section>


    </main>
  );
}
