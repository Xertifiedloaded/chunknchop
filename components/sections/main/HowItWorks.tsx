'use client';

import { STEPS } from '@/lib';
import { ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-brand font-worksans text-xs font-bold tracking-[0.2em]">
            HOW IT WORKS
          </p>

          <h2 className="mt-3 font-sora text-2xl font-bold tracking-tight text-black sm:text-3xl lg:text-4xl">
            Fresh in three <span className='text-brand'>simple</span> steps.
          </h2>
        </div>

        <div className="relative mt-10 sm:hidden">
          <span
            className="bg-brand/25 absolute top-6 bottom-6 left-5.5 w-px"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-6">
            {STEPS.map((step, index) => (
              <div
                key={step.number}
                className="relative flex items-start gap-4"
              >
                <div className="bg-brand text-brand-foreground relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm">
                  {index + 1}
                </div>

                <div className="bg-sand min-w-0 flex-1 rounded-2xl p-6 shadow-sm">
                  <p className="text-brand text-[11px] font-bold tracking-[0.15em]">
                    {step.number}
                  </p>

                  <h3 className="mt-2 text-lg font-bold text-black">
                    {step.title}
                  </h3>

                  <p className="text-ink mt-3 text-sm leading-6">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 hidden sm:flex sm:flex-col sm:items-center lg:mt-16">
          <div className="flex w-full flex-col items-stretch gap-6 lg:flex-row lg:items-stretch lg:justify-center lg:gap-0">
            {STEPS.map((step, index) => (
              <div
                key={step.number}
                className="flex flex-1 items-stretch lg:max-w-sm"
              >
                <div className="bg-sand flex min-h-65 w-full flex-1 flex-col rounded-2xl p-8 text-left shadow-sm transition-transform duration-300 hover:-translate-y-1">
                  <p className="text-brand text-xs font-bold tracking-[0.15em]">
                    {step.number}
                  </p>

                  <h3 className="mt-3 text-xl font-bold text-black">
                    {step.title}
                  </h3>

                  <p className="text-ink mt-4 text-sm leading-6">
                    {step.description}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="hidden items-center justify-center px-5 lg:flex">
                    <ArrowRight
                      size={24}
                      strokeWidth={1.8}
                      className="text-brand shrink-0"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}