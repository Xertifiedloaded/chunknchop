'use client';

import Image from 'next/image';
import { ArrowRight, ShieldCheck, Snowflake, Leaf, Sparkle, CheckCircle } from 'lucide-react';
import hero from '../assets/hero.svg';
const BADGES = [
  { label: 'Every Cut Certified' },
  { label: 'Cold Chain Delivery' },
  { label: '100% Organic' },
];

const FEATURES = [
  {
    title: 'Certified Processing',
    subtitle: 'HACCP STANDARD FACILITY',
    icon: ShieldCheck,
  },
  {
    title: 'Fresh Daily',
    subtitle: 'PORTIONED EVERY MORNING',
    icon: Sparkle,
  },
  {
    title: 'Fast Delivery',
    subtitle: 'SAME-DAY ACROSS LAGOS',
    icon: Snowflake,
  },
  {
    title: 'Secure Payment',
    subtitle: 'ENCRYPTED CHECKOUT',
    icon: ShieldCheck,
  },
  {
    title: 'Trusted by Families',
    subtitle: '12,000+ HAPPY HOMES',
    icon: Leaf,
  },
];

export default function Hero() {
  return (
    <section className="relative w-full bg-white">
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
          <div className="max-w-xl">
            <h1 className="text-4xl leading-[1.1] font-extrabold text-white sm:text-5xl lg:text-7xl lg:leading-[1.08]">
              Premium Quality Meat, <span className="text-[#E86B3E]">Delivered Fresh</span> Across
              Lagos.
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-relaxed text-neutral-200 sm:mt-6 sm:text-[15px]">
              Certified, hygienically processed livestock products expertly portioned, carefully
              packaged, and delivered to your doorstep or picked up at a ChunkNChop counter near
              you.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <button className="flex items-center justify-center gap-2 rounded-md bg-[#E86B3E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c8692f]">
                Shop Now
                <ArrowRight size={16} strokeWidth={2.2} />
              </button>
              <button className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-[#2D2D2D] transition-colors hover:bg-neutral-100">
                Browse Categories
              </button>
            </div>

            <div className="mt-7 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
              {BADGES.map((badge) => (
                <span
                  key={badge.label}
                  className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                    <CheckCircle size={14} />
                  </span>
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto -mt-8 max-w-6xl px-4 sm:-mt-14 sm:px-6 lg:-mt-16 lg:px-10">
        <div className="grid grid-cols-2 gap-3 rounded-2xl p-4 sm:grid-cols-3 sm:gap-4 sm:p-6 lg:grid-cols-5">
          {FEATURES.map(({ title, subtitle, icon: Icon }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-2 rounded-xl bg-[#F7F5F4] p-3 text-center sm:gap-3 sm:p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fdece1] sm:h-12 sm:w-12">
                <Icon size={18} className="text-[#E86B3E] sm:hidden" strokeWidth={2} />
                <Icon size={22} className="hidden text-[#E86B3E] sm:block" strokeWidth={2} />
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
