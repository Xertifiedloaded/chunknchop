'use client';

import Image from 'next/image';
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

const CATEGORIES = [
  { name: 'Chicken & Eggs', image: layedChicken, slug: 'chicken-eggs' },
  { name: 'Beef', image: beef, slug: 'beef' },
  { name: 'Fish & Seafood', image: shrimp, slug: 'seafood' },
  { name: 'Pork', image: pork, slug: 'pork' },
  { name: 'Goat & Mutton', image: mutton, slug: 'goat-mutton' },
  { name: 'Sausages', image: sausage, slug: 'sausages' },
  { name: 'BBQ Packs', image: bbq, slug: 'bbq' },
  { name: 'Game Meat', image: game, slug: 'game-meat' },
  { name: 'Dairy', image: diary, slug: 'dairy' },
  { name: 'Spices', image: spicies, slug: 'spices' },
];

export default function Categories() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
              Explore
            </span>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl">
              Shop by Category
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500 sm:text-base">
              Handpicked cuts and pantry essentials, curated for every
              Nigerian kitchen.
            </p>
          </div>

          <Link
            href="/shop"
            className="group hidden shrink-0 items-center gap-2 text-sm font-semibold text-neutral-900 transition-colors hover:text-orange-500 sm:flex"
          >
            View all
            <ArrowRight
              size={17}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="mt-10 flex gap-4 overflow-x-auto pb-3 scrollbar-none sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-5">
          {CATEGORIES.map((category) => (
            <Link
              key={category.name}
              href={`/shop?category=${category.slug}`}
              className="group relative min-w-42.5 overflow-hidden rounded-2xl bg-neutral-100 sm:min-w-0"
            >
              <div className="relative aspect-3/5 overflow-hidden sm:aspect-4/5">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 170px, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
                  <span className="text-sm font-semibold text-white sm:text-base">
                    {category.name}
                  </span>

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/95 text-neutral-900 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white">
                    <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/shop"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-3.5 text-sm font-semibold text-neutral-900 transition-colors hover:border-orange-500 hover:text-orange-500 sm:hidden"
        >
          View all categories
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}