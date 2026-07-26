'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';
import chunkWoman from '../assets/chunkwoman.svg';
const REASONS = [
  {
    title: 'Certified Quality',
    description:
      'Every cut is processed under strict hygiene and food safety standards, ensuring premium quality you can trust.',
  },
  {
    title: 'Cold Chain Freshness',
    description:
      'Our temperature-controlled storage and delivery system keeps every product fresh from processing to your doorstep.',
  },
  {
    title: 'Expertly Portioned',
    description:
      'Professionally trimmed, portioned, and vacuum-sealed for convenience, freshness, and less kitchen prep.',
  },
  {
    title: 'Convenient Delivery',
    description:
      'Order online and enjoy fast, reliable delivery or pick up your order at one of our retail locations.',
  },
  {
    title: 'Wide Product Selection',
    description:
      'From premium beef, chicken, seafood and goat meat to BBQ packs, sausages, dairy products, and everyday kitchen essentials.',
  },
  {
    title: 'Trusted by Families',
    description:
      'We help households, restaurants, and food businesses enjoy safe, consistent, and premium-quality meat every day.',
  },
];

export default function WhyUs() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto grid max-w-7xl items-start gap-16 px-6 py-20 lg:grid-cols-2 lg:px-10">
        <div className="relative h-95 w-full overflow-hidden rounded-2xl sm:h-107.5 lg:h-115">
          <Image
            src={chunkWoman}
            alt="A ChunkNChop staff member handing a customer their order"
            fill
            className="object-cover"
          />
        </div>

        <div>
          <p className="text-xs font-bold tracking-wider text-[#F26D3B]">WHY CHUNKNCHOP?</p>

          <h2 className="mt-3 text-4xl leading-tight font-extrabold text-black sm:text-[42px]">
            Every Cut Certified. Every Order You Can Trust.
          </h2>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-black">
            At ChunkNChop, we&apos;re committed to changing the way Nigerians buy meat by delivering
            products that are safer, fresher, and expertly prepared. From sourcing to delivery,
            every step is designed to give you confidence in what you&apos;re bringing home.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
            {REASONS.map((reason) => (
              <div key={reason.title} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#FFEDD5]">
                  <Check size={14} className="text-[#F26D3B]" strokeWidth={3} />
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

          <button className="mt-10 rounded-md bg-black px-16 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}
