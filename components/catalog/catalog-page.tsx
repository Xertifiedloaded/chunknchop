'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react';

import { formatPrice, type CatalogProduct } from '@/lib/catalog';
import { useCart } from '../cart/cart-provider';

export default function CatalogPage({ products }: { products: CatalogProduct[] }) {
  const [category, setCategory] = useState('All cuts');
  const [query, setQuery] = useState('');
  const { cartCount } = useCart();
  const categoryNames = [
    ...new Set(products.map((product) => product.category).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (category === 'All cuts' || product.category === category) &&
          `${product.name} ${product.cut} ${product.category}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [products, category, query],
  );

  return (
    <main className="flex min-h-screen flex-col bg-[#f8f8f6] text-[#24231f]">
      <section className="border-b border-[#e7e5df] bg-[#f8f8f6] px-[10.5%] pt-16.25 pb-9.5 max-[900px]:px-[6%] max-[650px]:px-[6%] max-[650px]:pt-10.75 max-[650px]:pb-6.75">
        <p className="m-0 flex items-center gap-2.25 text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
          <span className="h-px w-4.75 bg-brand" />
          FROM OUR COUNTER
        </p>

        <h1 className="mt-3.5 mb-2.75 font-heading text-[clamp(39px,5vw,58px)] font-normal leading-[1.05] tracking-[-0.045em] text-[#24231f] max-[650px]:text-[42px]">
          Find your <em className="text-brand">good cut.</em>
        </h1>

        <p className="m-0 text-[12px] leading-[1.7] text-[#77736d]">
          Browse the cuts currently available from ChunknChop.
        </p>

        <div className="mt-6.25 flex items-center gap-2.5 text-[9px] text-[#8a857c]">
          <Link href="/" className="transition-colors hover:text-brand">
            Home
          </Link>
          <span className="text-[#b7b3aa]">/</span>
          <span className="text-[#514f49]">Shop all</span>
        </div>
      </section>

      <section
        className="mx-auto grid w-[79%] flex-1 grid-cols-[190px_minmax(0,1fr)] gap-12 py-12 max-[900px]:w-[88%] max-[900px]:grid-cols-[160px_minmax(0,1fr)] max-[900px]:gap-[30px] max-[650px]:w-[88%] max-[650px]:grid-cols-1 max-[650px]:gap-[27px] max-[650px]:py-[30px]"
        aria-label="Product catalogue"
      >
  
        <aside className="self-start">
          <p className="mb-4.25 text-[9px] font-bold tracking-[0.14em] text-[#77736d]">
            SHOP BY CUT
          </p>

          <div className="flex flex-col">
            {['All cuts', ...categoryNames].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`flex min-h-10.5 items-center justify-between border-b border-[#e7e5df] text-left text-[11px] transition-colors ${
                  category === item
                    ? 'border-b-brand font-semibold text-brand'
                    : 'text-[#77736d] hover:text-[#24231f]'
                }`}
              >
                {item}
                <span
                  className={`text-[9px] tabular-nums ${
                    category === item ? 'text-brand' : 'text-[#a19c93]'
                  }`}
                >
                  {item === 'All cuts'
                    ? products.length
                    : products.filter((product) => product.category === item).length}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-7.5 border-l-2 border-brand bg-[#f1eee8] px-3.5 py-3.75">
            <span className="text-[8px] font-bold tracking-[0.13em] text-brand">GOOD TO KNOW</span>
            <p className="mt-2.25 mb-0 text-[10px] leading-[1.8] text-[#77736d]">
              Product details and availability come directly from our current counter.
            </p>
          </div>
        </aside>


        <div className="min-w-0">

          <div className="mb-5.5 flex min-h-10.75 items-center justify-between gap-4 border-b border-[#e7e5df] pb-3.25 max-[650px]:flex-col max-[650px]:items-stretch max-[650px]:gap-3.25">
            <div className="flex items-center gap-2.25 text-[10px] text-[#77736d]">
              <span className="font-semibold text-[#24231f]">
                {visibleProducts.length} {visibleProducts.length === 1 ? 'cut' : 'cuts'}
              </span>
              <span className="text-[#b7b3aa]">·</span>
              <span>Available now</span>
            </div>

            <label className="flex min-w-47.5 items-center gap-2.25 border-b border-[#d9d6ce] pb-2.25 text-[#77736d] focus-within:border-brand max-[650px]:w-full">
              <Search size={16} className="shrink-0" />

              <span className="sr-only">Search cuts</span>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search cuts"
                className="min-w-0 flex-1 border-0 bg-transparent text-[10px] text-[#24231f] outline-none placeholder:text-[#99948c]"
              />

              <SlidersHorizontal size={16} className="shrink-0" />
            </label>
          </div>


          <div className="grid grid-cols-3 gap-x-4.25 gap-y-7.5 max-[900px]:grid-cols-2 max-[650px]:grid-cols-2 max-[650px]:gap-x-2.75 max-[650px]:gap-y-5.75">
            {visibleProducts.map((product) => (
              <Link className="group min-w-0" href={`/products/${product.slug}`} key={product.id}>
                <div className="relative aspect-[0.92] overflow-hidden bg-[#e7e3db] max-[650px]:aspect-[0.85]">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
                  />

                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-[#f8f6f0] px-2 py-1.75 text-[8px] font-semibold tracking-widest text-[#5c5146] max-[650px]:top-2 max-[650px]:left-2 max-[650px]:px-1.5 max-[650px]:py-1.5 max-[650px]:text-[7px]">
                      {product.badge}
                    </span>
                  )}

                  <i className="absolute right-3 bottom-3 grid size-8 place-items-center bg-[#f8f6f0] text-[#514f49] not-italic transition-colors duration-200 group-hover:bg-brand group-hover:text-white max-[650px]:right-2 max-[650px]:bottom-2 max-[650px]:size-7">
                    <ArrowUpRight size={17} />
                  </i>
                </div>

                <div className="mt-3.25 flex items-center justify-between gap-2 text-[9px] font-semibold tracking-[0.08em] text-[#8a857c]">
                  <span>{product.category.toUpperCase()}</span>
                </div>

                <div className="mt-2 flex items-baseline justify-between gap-1.75 max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-1.25">
                  <h2 className="m-0 font-heading text-[17px] font-normal text-[#24231f] transition-colors group-hover:text-brand capitalize max-[650px]:text-[15px]">
                    {product.name}
                  </h2>

                  <strong className="shrink-0 text-[11px] font-semibold text-[#24231f]">
                    {formatPrice(product.priceCents)}
                    <small className="text-[9px] font-normal text-[#88847d]">
                      {` / ${product.unit}`}
                    </small>
                  </strong>
                </div>

                <p className="mt-1.75 mb-0 text-[10px] leading-[1.6] text-[#88847d]">
                  {product.productType === 'meatbox' && product.bundleItems?.length
                    ? product.bundleItems
                        .map((item) => `${item.name} ×${item.quantity}`)
                        .join(' · ')
                    : product.cut}
                </p>
              </Link>
            ))}

            {visibleProducts.length === 0 && (
              <div className="col-span-full flex min-h-67.5 flex-col items-center justify-center py-11.25 text-center text-[#77736d]">
                <Search size={21} className="text-brand" />

                <h2 className="mt-3.75 mb-1.75 font-heading text-[23px] font-normal text-[#24231f]">
                  {products.length ? 'No cuts found' : 'No cuts available yet'}
                </h2>

                <p className="mb-4.25 max-w-75 text-[10px] leading-[1.7]">
                  {products.length
                    ? 'Try a different search or category.'
                    : 'New products will appear here once they are published.'}
                </p>

                {products.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setCategory('All cuts');
                    }}
                    className="border-b border-brand pb-1.25 text-[9px] font-bold tracking-[0.12em] text-brand transition-colors hover:text-brand"
                  >
                    CLEAR FILTERS
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
