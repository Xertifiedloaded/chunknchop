'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import meatBox from '../assets/percel.svg';
export default function MeatBox() {
  return (
    <section className="w-full bg-[#25211E]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:px-10">
        <div>
          <p className="text-xs font-bold tracking-wider text-[#E86B3E]">CUSTOMIZE</p>
          <h2 className="mt-3 text-5xl leading-tight font-extrabold text-white">
            Build Your Own
            <br />
            <span className="text-[#E86B3E]">Meat</span> Box.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-neutral-300">
            Mix chicken, beef, seafood, pork and more into one perfectly portioned box — tailored to
            how your family eats.
          </p>

          <button className="mt-8 flex items-center gap-2 rounded-md bg-[#E86B3E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c8692f]">
            Start Building
            <ArrowRight size={16} strokeWidth={2.2} />
          </button>
        </div>

        <div className="relative mx-auto h-60 w-full max-w-md sm:h-80">
          <Image src={meatBox} alt="ChunkNChop custom meat box" fill className="object-cover" />
        </div>
      </div>
    </section>
  );
}
