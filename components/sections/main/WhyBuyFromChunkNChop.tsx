'use client';

import { ShieldCheck, Package, Zap, Scissors } from 'lucide-react';

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Certified Processing',
    description: 'NAFDAC-standard hygiene at every step.',
  },
  {
    icon: Package,
    title: 'Hygienic Packaging',
    description: 'Vacuum-sealed for optimal freshness.',
  },
  {
    icon: Zap,
    title: 'Cold Chain Delivery',
    description: 'Temperature-controlled from farm to door.',
  },
  {
    icon: Scissors,
    title: 'Expertly Portioned',
    description: 'Cut to your exact preference.',
  },
];

export default function WhyBuyFromChunkNChop() {
  return (
    <section className="border-charcoal w-full border-b-2 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        <h2 className="text-charcoal text-center text-2xl font-bold tracking-tight sm:text-3xl">Why Buy From ChunkNChop</h2>

        <div className="mt-10 grid grid-cols-2 gap-10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-8">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div key={benefit.title} className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">{Icon && <Icon className="text-brand h-6 w-6" strokeWidth={2} />}</div>

                <h3 className="text-charcoal mt-5 text-sm font-semibold">{benefit.title}</h3>

                <p className="text-ink mt-2 max-w-55 text-xs leading-5">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
