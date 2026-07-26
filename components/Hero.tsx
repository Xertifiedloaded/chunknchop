'use client';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Image from 'next/image';

import hero from '../assets/hero.svg';
import { BADGES, FEATURES } from '@/lib';

export default function Hero() {
  return (
    <section className="bg-brand-foreground relative w-full">
      <div className="relative min-h-140 w-full overflow-hidden sm:min-h-160 lg:min-h-180">
        <Image
          src={hero}
          alt="Premium cuts of meat packaged for delivery"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/35 to-black/10" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-6 py-16 sm:py-20 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <h1 className="font-sora text-brand-foreground text-4xl leading-[1.1] font-extrabold sm:text-3xl lg:text-6xl lg:leading-[1.08]">
              Premium Quality Meat, <span className="text-brand">Delivered Fresh</span> Across
              Lagos.
            </h1>

            <p className="text-brand-foreground/85 mt-5 max-w-lg text-sm leading-relaxed sm:mt-6 sm:text-[15px]">
              Certified, hygienically processed livestock products expertly portioned, carefully
              packaged, and delivered to your doorstep or picked up at a ChunkNChop counter near
              you.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <button className="bg-brand text-brand-foreground hover:bg-brand/90 flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-colors sm:hover:bg-[#c8692f]">
                Shop Now
                <ArrowRight size={16} strokeWidth={2.2} />
              </button>
              <button className="bg-brand-foreground text-ink hover:bg-brand-foreground/90 rounded-md px-6 py-3 text-sm font-semibold transition-colors sm:hover:bg-neutral-100">
                Browse Categories
              </button>
            </div>

            <div className="mt-7 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
              {BADGES.map((badge) => (
                <span
                  key={badge.label}
                  className="text-brand-foreground flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-medium backdrop-blur-sm sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                    <CheckCircle size={14} />
                  </span>
                  {badge.label}
                </span>
              ))}
            </div>

            <div className="mt-7 -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">
              {FEATURES.map(({ title, subtitle, icon: Icon }) => (
                <div
                  key={title}
                  className="border-brand-foreground/15 flex w-32 shrink-0 snap-start flex-col items-center gap-2 rounded-xl border bg-black/30 p-3 text-center backdrop-blur-sm"
                >
                  <span className="bg-brand-foreground/15 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon size={16} className="text-brand" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-brand-foreground text-[11px] font-semibold">{title}</p>
                    <p className="text-brand-foreground/70 mt-0.5 text-[9px] leading-snug">
                      {subtitle}
                    </p>
                  </div>
                </div>
              ))}
              <div className="w-3 shrink-0" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>


      <div className="relative mx-auto -mt-8 hidden max-w-6xl px-4 sm:-mt-14 sm:block sm:px-6 lg:-mt-16 lg:px-10">
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-3 sm:gap-4 sm:p-6 lg:grid-cols-5">
          {FEATURES.map(({ title, subtitle, icon: Icon }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-2 rounded-xl bg-[#F7F5F4] p-3 text-center sm:gap-3 sm:p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fdece1] sm:h-12 sm:w-12">
                <Icon size={18} className="text-brand sm:hidden" strokeWidth={2} />
                <Icon size={22} className="text-brand hidden sm:block" strokeWidth={2} />
              </span>
              <div>
                <p className="text-xs font-semibold text-[#2D2D2D] sm:text-sm">{title}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-neutral-500 sm:text-[9px]">
                  {subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}