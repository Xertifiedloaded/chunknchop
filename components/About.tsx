'use client';

import Image from 'next/image';
import chunkMan from '../assets/chunkman.svg';
export default function About() {
  return (
    <section className="w-full bg-[#f7f4ee]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:px-10">
        <div>
          <p className="text-xs font-bold tracking-wider text-[#E86B3E]">ABOUT CHUNCKNCHOP</p>

          <h2 className="mt-3 text-4xl leading-tight font-extrabold text-black sm:text-[42px]">
            Premium Quality.
            <br />
            <span className="text-[#E86B3E]">Expertly</span> Portioned.
          </h2>

          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-black">
            <p>
              At ChunkNChop, we&apos;re committed to changing the way Nigerians buy livestock
              products by delivering safer, fresher, and expertly prepared.
            </p>
            <p>
              We source our livestock responsibly, process every cut under strict hygiene standards,
              and expertly portion and package each order to preserve freshness from farm to table.
              Whether you&apos;re shopping online or visiting one of our retail locations, every
              product is prepared with the care, safety, and quality your family deserves.
            </p>
            <p>Because we believe great meals begin with trusted ingredients.</p>
            <p className="font-semibold text-[#E86B3E]">Every Cut Certified. Every Meal Better.</p>
          </div>

          <button className="mt-8 rounded-md bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800">
            Learn More About Us
          </button>
        </div>

        <div className="relative h-82.5 w-full overflow-hidden rounded-2xl sm:h-100 lg:h-105">
          <Image
            src={chunkMan}
            alt="ChunkNChop butcher expertly portioning fresh cuts of meat"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
