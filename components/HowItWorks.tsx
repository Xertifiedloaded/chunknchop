'use client';

import { STEPS } from '@/lib';
import { ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  return (
    <section className="bg-brand-foreground w-full">
      <div className="mx-auto max-w-6xl px-6 py-16 text-center sm:py-24 lg:px-10">
        <p className="text-brand text-xs font-bold tracking-wider">HOW IT WORKS</p>
        <h2 className="mt-3 text-3xl font-extrabold text-black sm:text-3xl lg:text-[34px]">
          Fresh in three <span className="text-brand">simple</span> steps.
        </h2>

        <div className="relative mt-12 sm:hidden">
          <span
            className="bg-brand/25 absolute top-5 bottom-5 left-5.25 w-px"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-6 text-left">
            {STEPS.map((step, index) => (
              <div key={step.number} className="relative flex gap-4">
                <div className="bg-brand text-brand-foreground relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  {index + 1}
                </div>
                <div className="bg-sand flex-1 rounded-2xl p-5">
                  <p className="text-brand text-[11px] font-bold tracking-wider">{step.number}</p>
                  <p className="mt-1 text-base font-bold text-black">{step.title}</p>
                  <p className="text-ink mt-2 text-[13px] leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden sm:mt-12 sm:flex sm:items-stretch sm:justify-center">
          {STEPS.map((step, index) => (
            <div key={step.number} className="flex sm:w-auto sm:flex-row sm:items-stretch">
              <div className="bg-sand w-65 rounded-2xl p-7 text-left">
                <p className="text-brand text-[11px] font-bold tracking-wider">{step.number}</p>
                <p className="mt-2 text-base font-bold text-black">{step.title}</p>
                <p className="text-ink mt-2 text-[13px] leading-relaxed">{step.description}</p>
              </div>
              {index < STEPS.length - 1 && (
                <ArrowRight size={20} className="text-brand mx-6 shrink-0 self-center" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}