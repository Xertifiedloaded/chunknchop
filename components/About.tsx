'use client';

import Image from 'next/image';
import chunkMan from '../assets/chunkman.svg';
export default function About() {
  return (
    <section className="w-full bg-[#f7f4ee]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-5 py-14 sm:gap-12 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-10">
        <div className="relative order-1 h-64 w-full overflow-hidden rounded-2xl sm:h-82.5 lg:order-2 lg:h-105">
          <Image
            src={chunkMan}
            alt="ChunkNChop butcher expertly portioning fresh cuts of meat"
            fill
            className="object-cover"
          />
        </div>

        <div className="order-2 lg:order-1">
          <p className="text-brand text-xs font-bold tracking-wider">ABOUT CHUNCKNCHOP</p>

          <h2 className="font-sora mt-3 text-3xl leading-tight font-extrabold text-black sm:text-[42px]">
            Premium Quality.
            <br />
            <span className="text-brand">Expertly</span> Portioned.
          </h2>

          <div className="font-worksans text-charcoal/70 mt-5 space-y-3.5 text-sm leading-relaxed sm:mt-6 sm:space-y-4 sm:text-[15px]">
            <p>
              At ChunkNChop, we&apos;re committed to changing the way Nigerians buy livestock
              products by delivering safer, fresher, and expertly prepared.
            </p>
            <p className="">
              We source our livestock responsibly, process every cut under strict hygiene standards,
              and expertly portion and package each order to preserve freshness from farm to table.
              Whether you&apos;re shopping online or visiting one of our retail locations, every
              product is prepared with the care, safety, and quality your family deserves.
            </p>
            <p>Because we believe great meals begin with trusted ingredients.</p>
            <p className="text-brand font-semibold">Every Cut Certified. Every Meal Better.</p>
          </div>

          <button className="text-brand-foreground mt-7 w-full rounded-md bg-black px-6 py-3 text-sm font-semibold transition-colors hover:bg-neutral-800 sm:mt-8 sm:w-auto">
            Learn More About Us
          </button>
        </div>
      </div>
    </section>
  );
}