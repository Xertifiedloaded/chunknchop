
'use client'

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react';

import { formatPrice, productCategories, type CatalogProduct } from '@/lib/catalog';
import { useCart } from '../cart/cart-provider';

export default function CatalogPage({ products }: { products: CatalogProduct[] }) {
  const [category, setCategory] = useState('All cuts');
  const [query, setQuery] = useState('');
  const { cartCount } = useCart();

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
      {/* Header */}
      <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#e7e5df] bg-white px-[7.1%] max-[900px]:px-[5%] max-[650px]:h-[65px]">
        <Link
          href="/"
          className="inline-flex items-center gap-[9px] text-[9px] font-bold tracking-[0.13em] text-[#514f49] transition-colors hover:text-[#e86b3e] max-[650px]:text-[8px]"
        >
          <ArrowLeft size={15} />
          BACK HOME
        </Link>

        <Link
          href="/"
          className="text-xs font-bold tracking-[0.16em] text-[#24231f]"
        >
          FIELD <i className="font-heading text-[15px] text-[#e86b3e]">&</i> FABLE
        </Link>

        <Link
          href="/cart"
          className="inline-flex items-center gap-[9px] text-[9px] font-bold tracking-[0.13em] text-[#514f49] transition-colors hover:text-[#e86b3e] max-[650px]:text-[8px]"
        >
          YOUR BAG
          <span className="grid size-5 place-items-center bg-[#f0eee8] text-[9px] text-[#24231f]">
            {cartCount}
          </span>
        </Link>
      </header>

      {/* Catalog introduction */}
      <section className="border-b border-[#e7e5df] bg-[#f8f8f6] px-[10.5%] pt-[65px] pb-[38px] max-[900px]:px-[6%] max-[650px]:px-[6%] max-[650px]:pt-[43px] max-[650px]:pb-[27px]">
        <p className="m-0 flex items-center gap-[9px] text-[9px] font-bold tracking-[0.15em] text-[#77736d]">
          <span className="h-px w-[19px] bg-[#e86b3e]" />
          FROM OUR COUNTER
        </p>

        <h1 className="mt-[14px] mb-[11px] font-heading text-[clamp(39px,5vw,58px)] font-normal leading-[1.05] tracking-[-0.045em] text-[#24231f] max-[650px]:text-[42px]">
          Find your <em className="text-[#a9442c]">good cut.</em>
        </h1>

        <p className="m-0 text-[12px] leading-[1.7] text-[#77736d]">
          Browse the cuts currently available from ChunknChop.
        </p>

        <div className="mt-[25px] flex items-center gap-[10px] text-[9px] text-[#8a857c]">
          <Link href="/" className="transition-colors hover:text-[#a9442c]">
            Home
          </Link>
          <span className="text-[#b7b3aa]">/</span>
          <span className="text-[#514f49]">Shop all</span>
        </div>
      </section>

      {/* Catalog content */}
      <section
        className="mx-auto grid w-[79%] flex-1 grid-cols-[190px_minmax(0,1fr)] gap-[48px] py-[48px] max-[900px]:w-[88%] max-[900px]:grid-cols-[160px_minmax(0,1fr)] max-[900px]:gap-[30px] max-[650px]:w-[88%] max-[650px]:grid-cols-1 max-[650px]:gap-[27px] max-[650px]:py-[30px]"
        aria-label="Product catalogue"
      >
        {/* Sidebar */}
        <aside className="self-start">
          <p className="mb-[17px] text-[9px] font-bold tracking-[0.14em] text-[#77736d]">
            SHOP BY CUT
          </p>

          <div className="flex flex-col">
            {['All cuts', ...productCategories].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`flex min-h-[42px] items-center justify-between border-b border-[#e7e5df] text-left text-[11px] transition-colors ${
                  category === item
                    ? 'border-b-[#e86b3e] font-semibold text-[#a9442c]'
                    : 'text-[#77736d] hover:text-[#24231f]'
                }`}
              >
                {item}
                <span
                  className={`text-[9px] tabular-nums ${
                    category === item ? 'text-[#a9442c]' : 'text-[#a19c93]'
                  }`}
                >
                  {item === 'All cuts'
                    ? products.length
                    : products.filter((product) => product.category === item).length}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-[30px] border-l-2 border-[#e86b3e] bg-[#f1eee8] px-[14px] py-[15px]">
            <span className="text-[8px] font-bold tracking-[0.13em] text-[#a9442c]">
              GOOD TO KNOW
            </span>
            <p className="mt-[9px] mb-0 text-[10px] leading-[1.8] text-[#77736d]">
              Product details and availability come directly from our current counter.
            </p>
          </div>
        </aside>

        {/* Product results */}
        <div className="min-w-0">
          {/* Controls */}
          <div className="mb-[22px] flex min-h-[43px] items-center justify-between gap-4 border-b border-[#e7e5df] pb-[13px] max-[650px]:flex-col max-[650px]:items-stretch max-[650px]:gap-[13px]">
            <div className="flex items-center gap-[9px] text-[10px] text-[#77736d]">
              <span className="font-semibold text-[#24231f]">
                {visibleProducts.length}{' '}
                {visibleProducts.length === 1 ? 'cut' : 'cuts'}
              </span>
              <span className="text-[#b7b3aa]">·</span>
              <span>Available now</span>
            </div>

            <label className="flex min-w-[190px] items-center gap-[9px] border-b border-[#d9d6ce] pb-[9px] text-[#77736d] focus-within:border-[#e86b3e] max-[650px]:w-full">
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

          {/* Products */}
          <div className="grid grid-cols-3 gap-x-[17px] gap-y-[30px] max-[900px]:grid-cols-2 max-[650px]:grid-cols-2 max-[650px]:gap-x-[11px] max-[650px]:gap-y-[23px]">
            {visibleProducts.map((product) => (
              <Link
                className="group min-w-0"
                href={`/products/${product.slug}`}
                key={product.id}
              >
                <div className="relative aspect-[0.92] overflow-hidden bg-[#e7e3db] max-[650px]:aspect-[0.85]">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
                  />

                  {product.badge && (
                    <span className="absolute top-[12px] left-[12px] bg-[#f8f6f0] px-[8px] py-[7px] text-[8px] font-semibold tracking-[0.1em] text-[#5c5146] max-[650px]:top-[8px] max-[650px]:left-[8px] max-[650px]:px-[6px] max-[650px]:py-[6px] max-[650px]:text-[7px]">
                      {product.badge}
                    </span>
                  )}

                  <i className="absolute right-[12px] bottom-[12px] grid size-[32px] place-items-center bg-[#f8f6f0] text-[#514f49] not-italic transition-colors duration-200 group-hover:bg-[#e86b3e] group-hover:text-white max-[650px]:right-[8px] max-[650px]:bottom-[8px] max-[650px]:size-[28px]">
                    <ArrowUpRight size={17} />
                  </i>
                </div>

                <div className="mt-[13px] flex items-center justify-between gap-2 text-[9px] font-semibold tracking-[0.08em] text-[#8a857c]">
                  <span>{product.category.toUpperCase()}</span>
                </div>

                <div className="mt-[8px] flex items-baseline justify-between gap-[7px] max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-[5px]">
                  <h2 className="m-0 font-heading text-[17px] font-normal text-[#24231f] transition-colors group-hover:text-[#a9442c] capitalize max-[650px]:text-[15px]">
                    {product.name}
                  </h2>

                  <strong className="shrink-0 text-[11px] font-semibold text-[#24231f]">
                    {formatPrice(product.priceCents)}
                    <small className="text-[9px] font-normal text-[#88847d]">
                      {` / ${product.unit}`}
                    </small>
                  </strong>
                </div>

                <p className="mt-[7px] mb-0 text-[10px] leading-[1.6] text-[#88847d]">
                  {product.cut}
                </p>
              </Link>
            ))}

            {/* Empty state */}
            {visibleProducts.length === 0 && (
              <div className="col-span-full flex min-h-[270px] flex-col items-center justify-center py-[45px] text-center text-[#77736d]">
                <Search size={21} className="text-[#a9442c]" />

                <h2 className="mt-[15px] mb-[7px] font-heading text-[23px] font-normal text-[#24231f]">
                  {products.length ? 'No cuts found' : 'No cuts available yet'}
                </h2>

                <p className="mb-[17px] max-w-[300px] text-[10px] leading-[1.7]">
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
                    className="border-b border-[#a9442c] pb-[5px] text-[9px] font-bold tracking-[0.12em] text-[#a9442c] transition-colors hover:text-[#e86b3e]"
                  >
                    CLEAR FILTERS
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex min-h-[65px] items-center justify-between gap-4 border-t border-[#e7e5df] bg-[#f8f8f6] px-[7.1%] text-[9px] tracking-[0.1em] text-[#77736d] max-[650px]:flex-wrap max-[650px]:px-[6%] max-[650px]:py-[17px]">
        <span className="font-heading text-[15px] font-semibold tracking-normal text-[#24231f]">
          ChunknChop
        </span>

        <span className="text-[8px] tracking-[0.13em] max-[650px]:hidden">
          GOOD MEAT. GOOD LIVING.
        </span>

        <Link
          href="/"
          className="inline-flex items-center gap-[6px] font-bold transition-colors hover:text-[#e86b3e]"
        >
          RETURN HOME
          <ArrowUpRight size={14} />
        </Link>
      </footer>
    </main>
  );
}
