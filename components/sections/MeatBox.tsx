"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import meatBox from "@/assets/percel.svg";
export default function MeatBox() {
  return (
    <section className="w-full bg-charcoal">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 text-center lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-24 lg:text-left">
        <div className="order-2 lg:order-1">
          <p className="text-xs font-bold tracking-wider text-brand">CUSTOMIZE</p>
          <h2 className="mt-3 font-sora text-3xl leading-tight font-extrabold text-white sm:text-4xl lg:text-5xl">
            Build Your Own
            <br />
            <span className="text-brand">Meat</span> Box.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-brand-foreground/70 lg:mx-0 lg:mt-5 lg:text-[15px]">
            Mix chicken, beef, seafood, pork and more into one perfectly portioned box — tailored to how your family eats.
          </p>

          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-foreground lg:mt-8 lg:w-auto lg:justify-start">
            Start Building
            <ArrowRight size={16} strokeWidth={2.2} />
          </button>
        </div>

        <div className="relative order-1 mx-auto h-56 w-full max-w-md sm:h-80 lg:order-2">
          <div className="absolute inset-8 rounded-full bg-brand/20 blur-3xl lg:hidden" aria-hidden="true" />
          <Image src={meatBox} alt="ChunkNChop custom meat box" fill className="relative object-cover" />
        </div>
      </div>
    </section>
  );
}
