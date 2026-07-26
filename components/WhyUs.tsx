'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';
import chunkWoman from '../assets/chunkwoman.svg';
import { REASONS } from '@/lib';

export default function WhyUs() {
  return (
    <section className="bg-brand-foreground w-full">
      <div className="mx-auto grid max-w-7xl items-start gap-8 px-5 py-14 sm:gap-12 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-10">
        <div className="relative h-64 w-full overflow-hidden rounded-2xl sm:h-107.5 lg:h-115">
          <Image
            src={chunkWoman}
            alt="A ChunkNChop staff member handing a customer their order"
            fill
            className="object-cover"
          />
        </div>

        <div>
          <p className="text-brand text-xs font-bold tracking-wider">WHY CHUNKNCHOP?</p>

          <h2 className="font-sora text-charcoal mt-3 text-2xl leading-tight font-extrabold sm:text-[42px]">
            Every Cut Certified. Every Order You Can Trust.
          </h2>

          <p className="text-charcoal/70 mt-5 max-w-xl text-sm leading-relaxed sm:mt-6 sm:text-[15px]">
            At ChunkNChop, we&apos;re committed to changing the way Nigerians buy meat by delivering
            products that are safer, fresher, and expertly prepared. From sourcing to delivery,
            every step is designed to give you confidence in what you&apos;re bringing home.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-5 sm:mt-8 sm:grid-cols-2 sm:gap-y-6">
            {REASONS.map((reason) => (
              <div key={reason.title} className="flex gap-3">
                <span className="bg-sand mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
                  <Check size={14} className="text-brand" strokeWidth={3} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-black">{reason.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
                    {reason.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button className="text-brand-foreground mt-8 w-full rounded-md bg-black px-6 py-3 text-sm font-semibold transition-colors hover:bg-neutral-800 sm:mt-10 sm:w-auto sm:px-16">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}