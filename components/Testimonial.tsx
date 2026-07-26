'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';
import { TESTIMONIALS } from '@/lib';

export default function Testimonials() {
  return (
    <section className="bg-sand w-full">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <div>
          <p className="font-worksans text-brand text-xs font-bold tracking-wider">
            LOVED BY OUR CUSTOMERS ❤️
          </p>
          <h2 className="text-charcoal mt-3 text-3xl font-extrabold sm:text-4xl">
            What our <span className="text-brand">customers</span> are saying.
          </h2>
        </div>

        <div className="mt-8 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="w-[82%] shrink-0 snap-start rounded-2xl bg-white p-5 text-left shadow-sm sm:w-auto sm:p-7"
            >
              <div className="text-brand flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" stroke="none" />
                ))}
              </div>
              <p className="text-charcoal/70 mt-3 text-sm leading-relaxed sm:mt-4 sm:text-[15px]">
                &quot;{t.quote}&quot;
              </p>
              <div className="mt-5 flex items-center gap-3 sm:mt-6">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${t.avatarBg}`}
                >
                  {t.initial}
                </div>
                <div>
                  <p className="text-sm font-bold text-black">{t.name}</p>
                  <p className="text-ink text-xs">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}