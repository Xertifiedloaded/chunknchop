'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: 'The freshness is unreal. My weekend jollof-and-suya nights are on a whole other level.',
    name: 'Adaeze O.',
    location: 'Lekki, Lagos',
    initial: 'A',
    avatarBg: 'bg-[#F5D7C8] text-[#B5502E]',
  },
  {
    quote:
      'Cleanly packaged, always on time, and portions are exactly what I ask for. Never going back.',
    name: 'Tunde B.',
    location: 'Ikoyi, Lagos',
    initial: 'T',
    avatarBg: 'bg-neutral-200 text-neutral-500',
  },
  {
    quote:
      'Feeding a family of five just got easier. The subscription is genuinely worth every naira.',
    name: 'Chiamaka E.',
    location: 'Yaba, Lagos',
    initial: 'C',
    avatarBg: 'bg-[#F7D9CF] text-[#C4593A]',
  },
];

export default function Testimonials() {
  return (
    <section className="w-full bg-[#F5ECE6]">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:px-10 lg:py-24">
        <p className="text-xs font-bold tracking-wider text-[#E86B3E]">LOVED BY OUR CUSTOMERS ❤️</p>
        <h2 className="mt-3 text-4xl font-extrabold text-black">
          What our <span className="text-[#E86B3E]">customers</span> are saying.
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl bg-white p-7 text-left shadow-sm">
              <div className="flex gap-0.5 text-[#E86B3E]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" stroke="none" />
                ))}
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-black">&quot;{t.quote}&quot;</p>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${t.avatarBg}`}
                >
                  {t.initial}
                </div>
                <div>
                  <p className="text-sm font-bold text-black">{t.name}</p>
                  <p className="text-xs text-black">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
