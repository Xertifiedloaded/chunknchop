'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart/cart-provider';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { productCategories, type CatalogProduct } from '@/lib/catalog';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import AboutSection from '@/components/home/about-section';

const container = 'mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12';
const sectionHeading =
  'mt-3 mb-0 text-[clamp(34px,4vw,51px)] leading-[1] font-normal tracking-[-0.05em]';

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={`flex items-center gap-2.5 font-worksans text-[11px] font-bold tracking-[0.15em] ${
        light ? 'text-[#e4ddd4]' : 'text-[#77736d]'
      }`}
    >
      <span className="h-px w-5 bg-brand" />
      {children}
    </p>
  );
}

function TextLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 border-b border-[#b7b3aa] pb-1 text-[11px] font-bold tracking-[0.12em] whitespace-nowrap text-[#514f49] transition-colors hover:border-brand hover:text-brand ${className}`}
    >
      {children} <ArrowUpRight size={15} />
    </Link>
  );
}

function ProductCard({
  product,
  onAdd,
  added,
  isFavorite,
  onToggleFavorite,
}: {
  product: CatalogProduct;
  onAdd: (product: CatalogProduct) => void;
  added: boolean;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
}) {
  return (
    <article className="group flex min-w-0 flex-col">
      <div className="relative aspect-4/5 overflow-hidden bg-[#e7e3db]">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {product.badge && (
          <span className="absolute top-2 left-2 bg-[#f8f6f0] px-2 py-1.5 text-[9px] tracking-[0.1em] text-[#5c5146] sm:top-3 sm:left-3 sm:text-[10px]">
            {product.badge}
          </span>
        )}

        <button
          className="absolute top-2 right-2 grid h-8 w-8 cursor-pointer place-items-center border-0 bg-white transition-colors hover:text-brand sm:top-3 sm:right-3"
          aria-label={`${isFavorite ? 'Remove' : 'Save'} ${product.name} ${isFavorite ? 'from' : 'to'} favorites`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(product.slug)}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        <button
          className={`absolute right-2 bottom-2 grid h-9 w-9 cursor-pointer place-items-center border-0 text-2xl transition-colors duration-200 sm:right-3 sm:bottom-3 ${
            added
              ? 'bg-brand text-white'
              : 'bg-white text-[#292721] hover:bg-brand hover:text-white'
          }`}
          onClick={() => onAdd(product)}
          aria-label={`Add ${product.name} to bag`}
        >
          {added ? <Check size={17} /> : <span className="leading-none">+</span>}
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <p className="m-0 text-[10px] tracking-[0.06em] text-[#8a857c] uppercase">
          {product.category}
        </p>

        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <h3 className="m-0 font-he text-[15px] font-normal sm:text-base">
            <Link href={`/products/${product.slug}`} className="transition-colors hover:text-brand">
              {product.name}
            </Link>
          </h3>

          <strong className="shrink-0 text-xs font-semibold">
            ₦
            {(product.priceCents / 100).toLocaleString('en-NG', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <small className="text-[10px] font-normal text-[#77736d]">{` / ${product.unit}`}</small>
          </strong>
        </div>

        <p className="mt-1.5 mb-0 text-[11px] text-[#88847d]">{product.cut}</p>
      </div>
    </article>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website: '' }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to subscribe right now.');
      }

      setEmail('');
      setStatus(result.message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to subscribe right now.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="w-full md:max-w-105" onSubmit={subscribe}>
      <label htmlFor="newsletter-email" className="text-xs text-[#ddd5cc]">
        Leave your email for recipes and seasonal updates.
      </label>

      <div className="my-3 flex border-b border-[#96877e]">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#b5aaa1]"
        />

        <button
          type="submit"
          disabled={submitting}
          aria-label="Subscribe to newsletter"
          className="w-10 cursor-pointer border-0 bg-transparent text-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowRight size={19} />
        </button>
      </div>

      <small className="text-[10px] text-[#aaa099]">
        Your email is stored securely. Email delivery is not configured yet.
      </small>

      <p className="mt-2 min-h-4 text-[11px] text-[#ddd5cc]" role="status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}

export default function Storefront({ products }: { products: CatalogProduct[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All cuts');

  const { cartCount, addProduct, error: cartError } = useCart();

  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          (category === 'All cuts' || product.category === category) &&
          `${product.name} ${product.category} ${product.cut}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [products, category, query],
  );

  const categories = productCategories.flatMap((name, index) => {
    const matching = products.filter((product) => product.category === name);

    return matching.length
      ? [
          {
            name,
            count: `${matching.length} ${matching.length === 1 ? 'cut' : 'cuts'}`,
            image: matching[0].imageUrl,
            index,
          },
        ]
      : [];
  });

  const addToCart = (product: CatalogProduct) => {
    addProduct(product);
    setLastAdded(product.slug);

    window.setTimeout(
      () => setLastAdded((current) => (current === product.slug ? null : current)),
      1200,
    );
  };

  const toggleFavorite = (slug: string) =>
    setFavorites((current) => {
      const updated = new Set(current);

      if (updated.has(slug)) updated.delete(slug);
      else updated.add(slug);

      return updated;
    });

  const promises = [
    ['01', 'Responsibly raised', 'No shortcuts. Ever.'],
    ['02', 'Cut by our butchers', 'Craft you can taste.'],
    ['03', 'Thoughtfully packed', 'Care from our counter.'],
  ];

  return (
    <main id="home" className="relative">
      <section className="relative flex min-h-[580px] items-end overflow-hidden bg-[#402b28] text-white md:min-h-[620px] md:items-center">
        <Image
          src="/images/market-hero.png"
          alt="Freshly prepared cuts from the butcher"
          fill
          priority
          className="object-cover object-[62%_center] md:object-[center_54%]"
        />

        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(25,21,20,0.92)_0%,rgba(29,24,23,0.6)_55%,rgba(25,21,20,0.1)_100%)] md:bg-[linear-gradient(90deg,rgba(29,25,23,0.86)_0%,rgba(38,28,26,0.69)_42%,rgba(28,22,21,0.08)_100%),linear-gradient(0deg,rgba(0,0,0,0.23),transparent_35%)]" />

        <div className={`relative z-10 ${container} pt-24 pb-24 md:py-20`}>
          <div className="max-w-[540px]">
            <Eyebrow light>THE GOOD STUFF, FROM THE SOURCE</Eyebrow>

            <h1 className="mt-5 mb-4 text-[clamp(44px,6vw,72px)] leading-[1] font-normal tracking-[-0.05em]">
              Better meat.
              <br />
              <em className="font-heading font-normal text-brand">Better moments.</em>
            </h1>

            <p className="mt-5 mb-7 max-w-[400px] text-sm leading-[1.8] text-[#eee9e2]">
              Thoughtfully sourced, carefully cut, and ready to make more of the meals you love.
            </p>

            <Link
              href="#shop"
              className="inline-flex min-h-12 items-center gap-5 bg-[#f8f6f0] px-5 text-[11px] font-bold tracking-[0.12em] text-[#24231f] transition-colors duration-200 hover:bg-brand"
            >
              SHOP THE COLLECTION <ArrowUpRight size={16} />
            </Link>

            <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#e6e1db]">
              <span>ChunknChop</span>
              <span>Good meat. Good people. Good living.</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-6 z-10 hidden md:block">
          <div className={container}>
            <a
              href="#categories"
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.17em] text-[#eee9e2]"
            >
              SCROLL TO DISCOVER <ArrowDown size={14} />
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-[#eeede8] bg-[#f8f8f6]" aria-label="Our promises">
        <div
          className={`${container} grid grid-cols-1 items-center gap-4 py-5 sm:grid-cols-3 sm:gap-0 sm:py-6 lg:grid-cols-[1fr_1fr_1fr_1.2fr]`}
        >
          {promises.map(([number, heading, description], index) => (
            <div
              key={number}
              className={`flex items-start gap-3 sm:px-5 sm:first:pl-0 ${
                index < 2 ? 'sm:border-r sm:border-[#e6e4de]' : ''
              } ${index === 2 ? 'lg:border-r lg:border-[#e6e4de]' : ''} ${
                index < 2 ? 'border-b border-[#e6e4de] pb-4 sm:border-b-0 sm:pb-0' : ''
              }`}
            >
              <span className="font-heading text-sm text-brand">{number}</span>
              <p className="m-0 text-xs font-semibold">
                {heading}
                <span className="mt-1 block text-[11px] font-normal text-[#88847d]">
                  {description}
                </span>
              </p>
            </div>
          ))}

          <div className="hidden items-center justify-end gap-3 font-he text-[13px] text-[#77736d] italic lg:flex">
            A better kind of butcher shop <ArrowRight size={16} />
          </div>
        </div>
      </section>

      <AboutSection />

      <section className="py-16 lg:py-24" id="categories">
        <div className={container}>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <Eyebrow>FIND YOUR FAVOURITE</Eyebrow>
              <h2 className={sectionHeading}>
                Good things,
                <br />
                <em className="font-he font-normal text-brand">by the cut.</em>
              </h2>
            </div>

            <TextLink href="/shop" className="hidden sm:inline-flex">
              EXPLORE ALL CUTS
            </TextLink>
          </div>

          {categories.length ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              {categories.map((item) => (
                <Link
                  href="#shop"
                  key={item.name}
                  onClick={() => setCategory(item.name)}
                  className="group relative aspect-[4/5] overflow-hidden bg-[#d2c6b7] text-white"
                >
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.045]"
                  />

                  <span className="absolute inset-x-0 top-[35%] bottom-0 bg-[linear-gradient(0deg,rgba(20,18,16,0.75),transparent)]" />

                  <span className="absolute top-3 left-3 z-10 text-[10px] tracking-widest text-[#f1e9df] sm:top-4 sm:left-4">
                    {String(item.index + 1).padStart(2, '0')}
                  </span>

                  <div className="absolute inset-x-3 bottom-3 z-10 flex items-end justify-between gap-2 sm:inset-x-4 sm:bottom-4">
                    <div className="min-w-0">
                      <h3 className="m-0 font-he text-lg font-normal sm:text-[23px]">
                        {item.name}
                      </h3>
                      <p className="mt-1 mb-0 text-[11px] text-[#e4ded5]">{item.count}</p>
                    </div>

                    <span className="grid h-8 w-8 shrink-0 place-items-center border border-white/65 transition-colors duration-200 group-hover:border-brand group-hover:bg-brand">
                      <ArrowUpRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-12 text-[#77736d]">
              Our counter is being stocked. Check back soon for available cuts.
            </p>
          )}
        </div>
      </section>

      <section className="bg-[#f8f8f6] py-16 lg:py-24" id="shop">
        <div className={container}>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <Eyebrow>FROM OUR COUNTER</Eyebrow>
              <h2 className={sectionHeading}>
                The <em className="font-he font-normal text-brand">good cuts.</em>
              </h2>
              <p className="mt-3 mb-0 max-w-[420px] text-[13px] leading-[1.6] text-[#77736d]">
                Browse the cuts currently available from ChunknChop.
              </p>
            </div>

            <TextLink href="/shop" className="hidden sm:inline-flex">
              VIEW THE FULL RANGE
            </TextLink>
          </div>

          <div className="mb-6 flex flex-col-reverse border-b border-[#e7e5df] md:flex-row md:items-center md:justify-between md:gap-6">
            <div
              className="-mx-5 flex gap-6 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-8 sm:px-8 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
              role="group"
              aria-label="Filter by category"
            >
              {['All cuts', ...productCategories].map((item) => (
                <button
                  key={item}
                  className={`shrink-0 cursor-pointer border-0 border-b-2 border-solid bg-transparent py-3 text-xs whitespace-nowrap transition-colors ${
                    category === item
                      ? 'border-b-brand text-[#24231f]'
                      : 'border-b-transparent text-[#77736d] hover:text-[#24231f]'
                  }`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <label className="flex w-full items-center gap-2 border-b border-[#e7e5df] py-3 text-[#77736d] md:w-auto md:border-b-0 md:py-2">
              <Search size={16} className="shrink-0" />
              <span className="sr-only">Search products</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find your cut"
                className="min-w-0 flex-1 border-0 bg-transparent text-xs outline-none focus-visible:outline focus-visible:outline-offset-[3px] focus-visible:outline-brand md:w-36 md:flex-none"
              />
              <SlidersHorizontal size={16} className="shrink-0" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 lg:grid-cols-4">
            {filteredProducts.length ? (
              filteredProducts
                .slice(0, 4)
                .map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={addToCart}
                    added={lastAdded === product.slug}
                    isFavorite={favorites.has(product.slug)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))
            ) : (
              <p className="col-span-full py-12 text-[#77736d]">
                {products.length
                  ? 'No cuts match your search. Try another filter.'
                  : 'No products are available yet. Please check back soon.'}
              </p>
            )}
          </div>

          <div className="mt-8 sm:hidden">
            <TextLink href="/shop">VIEW THE FULL RANGE</TextLink>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2" id="story">
        <div className="relative min-h-[340px] overflow-hidden bg-[#d4cabe] lg:min-h-[540px]">
          <img
            src="https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&w=1200&q=85"
            alt="A butcher carefully preparing a fresh cut"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <span className="absolute bottom-6 left-6 grid h-24 w-24 -rotate-12 place-items-center rounded-full border border-white/80 text-center font-he text-base leading-[1.05] text-white sm:bottom-10 sm:left-10">
            GOOD
            <br />
            BY
            <br />
            NATURE
          </span>
        </div>

        <div className="flex items-center px-5 py-14 sm:px-8 lg:px-16 lg:py-20">
          <div className="max-w-[440px]">
            <Eyebrow>A LITTLE ABOUT US</Eyebrow>

            <h2 className={`${sectionHeading} mb-5`}>
              Know your
              <br />
              <em className="font-he font-normal text-brand">butcher.</em>
            </h2>

            <p className="mb-6 text-[13px] leading-[1.9] text-[#77736d]">
              We believe the best meals begin long before the kitchen. That&apos;s why we work with
              small farms who care for their animals and our planet — then bring every cut to you
              with the care it deserves.
            </p>

            <TextLink href="/about">THE ChunknChop WAY</TextLink>

            <div className="mt-8 border-t border-[#eae9e5] pt-8 font-he text-lg text-brand italic">
              Good meat. Good people. Good living.
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#332925] py-12 text-white lg:py-16">
        <div
          className={`${container} flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12`}
        >
          <div>
            <Eyebrow light>NOTES FROM THE FARM</Eyebrow>

            <h2 className="mt-4 mb-0 text-[clamp(34px,4vw,48px)] leading-[1] font-normal tracking-[-0.05em]">
              A little goodness,
              <br />
              <em className="font-he font-normal text-brand">in your inbox.</em>
            </h2>
          </div>

          <NewsletterForm />
        </div>
      </section>

      {cartError && (
        <div
          className="fixed inset-x-4 bottom-4 z-50 flex animate-[toast-in_0.2s_ease-out] items-center gap-2 bg-[#282621] px-4 py-3.5 text-xs text-white shadow-[0_8px_30px_#0002] sm:inset-x-auto sm:right-6 sm:bottom-6"
          role="alert"
        >
          {cartError}
        </div>
      )}

      {lastAdded && !cartError && (
        <div
          className="fixed inset-x-4 bottom-4 z-50 flex animate-[toast-in_0.2s_ease-out] items-center gap-2 bg-[#282621] px-4 py-3.5 text-xs text-white shadow-[0_8px_30px_#0002] sm:inset-x-auto sm:right-6 sm:bottom-6"
          role="status"
        >
          <Check size={16} className="text-brand" />
          Added to your bag
          <span className="text-[11px] text-[#c6bcb1]">
            {cartCount} {cartCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      )}
    </main>
  );
}
