'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import meatBox from '../assets/percel.svg';
export default function MeatBox() {
  return (
    <section className="bg-charcoal w-full">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 text-center lg:gap-12 lg:px-10 lg:py-24 lg:text-left lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <p className="text-brand text-xs font-bold tracking-wider">CUSTOMIZE</p>
          <h2 className="font-sora mt-3 text-3xl leading-tight font-extrabold text-white sm:text-4xl lg:text-5xl">
            Build Your Own
            <br />
            <span className="text-brand">Meat</span> Box.
          </h2>
          <p className="text-brand-foreground/70 mx-auto mt-4 max-w-md text-sm leading-relaxed lg:mx-0 lg:mt-5 lg:text-[15px]">
            Mix chicken, beef, seafood, pork and more into one perfectly portioned box — tailored to
            how your family eats.
          </p>

          <button className="bg-brand hover:bg-brand-foreground mt-6 flex w-full items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold text-white transition-colors lg:mt-8 lg:w-auto lg:justify-start">
            Start Building
            <ArrowRight size={16} strokeWidth={2.2} />
          </button>
        </div>

        <div className="order-1 relative mx-auto h-56 w-full max-w-md sm:h-80 lg:order-2">
          <div
            className="bg-brand/20 absolute inset-8 rounded-full blur-3xl lg:hidden"
            aria-hidden="true"
          />
          <Image
            src={meatBox}
            alt="ChunkNChop custom meat box"
            fill
            className="relative object-cover"
          />
        </div>
      </div>
    </section>
  );
}