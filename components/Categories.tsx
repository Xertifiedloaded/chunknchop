'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import layedChicken from '../assets/egg_lay.svg';
import beef from '../assets/meat.svg';
import shrimp from '../assets/shrimp.svg';
import pork from '../assets/pork.svg';
import mutton from '../assets/mutton.svg';
import sausage from '../assets/sausage.svg';
import bbq from '../assets/bbq.svg';
import game from '../assets/Game_meat.svg';
import diary from '../assets/diary.svg';
import spicies from '../assets/spice.svg';

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
    <section className="w-full bg-[#F5ECE6]">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold tracking-wider text-[#E55A2A]">EXPLORE</p>
            <h2 className="mt-2 text-3xl font-extrabold text-black sm:text-[34px]">
              Shop by Category
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Handpicked cuts and pantry essentials, curated for every Nigerian kitchen.
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-[#E55A2A] hover:text-[#c8692f] sm:flex"
          >
            View all
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((category) => (
            <Link
              key={category.name}
              href={`/shop?category=${category.slug}`}
              className="group overflow-hidden rounded-xl bg-[#F3F4F6] text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square w-full">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-neutral-800">{category.name}</span>
                <ChevronRight
                  size={15}
                  className="text-neutral-400 transition-transform group-hover:translate-x-0.5"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
