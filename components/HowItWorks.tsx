'use client';

import { ArrowRight, ArrowDown } from 'lucide-react';

const STEPS = [
  {
    number: 'STEP 01',
    title: 'Choose Your Meat',
    description: 'Browse premium cuts and build the order that fits your table.',
  },
  {
    number: 'STEP 02',
    title: 'Expertly Prepared',
    description: 'Our butchers portion, clean, and vacuum-seal to order.',
  },
  {
    number: 'STEP 03',
    title: 'Delivered Fresh',
    description: 'Cold-chain delivered same day — right to your door.',
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 text-center sm:py-24 lg:px-10">
        <p className="text-xs font-bold tracking-wider text-[#E67E51]">HOW IT WORKS</p>
        <h2 className="mt-3 text-2xl font-extrabold text-black sm:text-3xl lg:text-[34px]">
          Fresh in three <span className="text-[#E67E51]">simple</span> steps.
        </h2>

        <div className="mt-12 flex flex-col items-center gap-6 sm:flex-row sm:items-stretch sm:justify-center">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className="flex w-full flex-col items-center gap-6 sm:w-auto sm:flex-row"
            >
              <div className="w-full max-w-sm rounded-2xl bg-[#F5ECE6] p-7 text-left sm:w-65">
                <p className="text-[11px] font-bold tracking-wider text-neutral-400">
                  {step.number}
                </p>
                <p className="mt-2 text-base font-bold text-black">{step.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
                  {step.description}
                </p>
              </div>
              {index < STEPS.length - 1 && (
                <>
                  <ArrowDown size={20} className="shrink-0 text-[#E67E51] sm:hidden" />
                  <ArrowRight size={20} className="hidden shrink-0 text-[#E67E51] sm:block" />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
