'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import layedChicken from '@/assets/egg_lay.svg';
import beef from '@/assets/meat.svg';
import shrimp from '@/assets/shrimp.svg';
import pork from '@/assets/pork.svg';
import mutton from '@/assets/mutton.svg';
import sausage from '@/assets/sausage.svg';
import bbq from '@/assets/bbq.svg';
import game from '@/assets/Game_meat.svg';
import diary from '@/assets/diary.svg';
import spicies from '@/assets/spice.svg';

export default function Categories() {
  const [categories, setCategories] = React.useState<Array<{ name: string; slug: string; image?: string }>>(() => []);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to load categories');
        const data = await res.json();
        if (cancelled) return;
        setCategories(data);
      } catch (err) {
        // Fallback to an empty list if fetch fails — intentionally silent so
        // the landing page still renders.
        console.error('Failed to fetch categories for landing:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <span className="text-xs font-semibold tracking-[0.2em] text-orange-500 uppercase">Explore</span>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl">Shop by Category</h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500 sm:text-base">Handpicked cuts and pantry essentials, curated for every Nigerian kitchen.</p>
          </div>

          <Link href="/shop" className="group hidden shrink-0 items-center gap-2 text-sm font-semibold text-neutral-900 transition-colors hover:text-orange-500 sm:flex">
            View all
            <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-10 flex scrollbar-none gap-4 overflow-x-auto pb-3 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
          {loading ? (
            <div className="text-sm text-neutral-500">Loading categories…</div>
          ) : (
            categories.map((category) => (
              <Link key={category.name} href={`/shop?category=${category.slug}`} className="group relative min-w-42.5 overflow-hidden rounded-2xl bg-neutral-100 sm:min-w-0">
                <div className="relative aspect-3/5 overflow-hidden sm:aspect-4/5">
                  {/* If category.image is not provided by the API, the image component will be omitted */}
                  {category.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={category.image} alt={category.name} className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105" />
                  ) : (
                    // fallback to local asset mapped by slug
                    (() => {
                      const map: Record<string, any> = {
                        'chicken-eggs': layedChicken,
                        beef,
                        seafood: shrimp,
                        pork,
                        'goat-mutton': mutton,
                        sausages: sausage,
                        bbq,
                        'game-meat': game,
                        dairy: diary,
                        spices: spicies,
                      };
                      const asset = map[category.slug] ?? null;
                      return asset ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.src ?? asset} alt={category.name} className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-600">{category.name}</div>
                      );
                    })()
                  )}

                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
                    <span className="text-sm font-semibold text-white sm:text-base">{category.name}</span>

                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/95 text-neutral-900 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white">
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        <Link href="/shop" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3.5 text-sm font-semibold text-neutral-900 transition-colors hover:border-orange-500 hover:text-orange-500 sm:hidden">
          View all categories
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
