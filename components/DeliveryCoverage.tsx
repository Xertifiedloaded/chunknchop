'use client';

import { MapPin } from 'lucide-react';

const AREAS = [
  'Lekki',
  'Ikoyi',
  'Victoria Island',
  'Ajah',
  'Yaba',
  'Surulere',
  'Magodo',
  'Gbagada',
  'Apapa',
  'Ikeja',
  'Maryland',
  'Festac',
];

export default function DeliveryCoverage() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 py-14 sm:gap-12 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-24">
        <div>
          <p className="text-brand text-xs font-bold tracking-wider">DELIVERY COVERAGE</p>
          <h2 className="font-sora text-charcoal mt-3 text-3xl leading-tight font-extrabold sm:text-4xl lg:text-[42px]">
            We deliver fresh across Lagos.
          </h2>
          <p className="text-ink mt-4 max-w-md text-sm leading-relaxed sm:mt-5 sm:text-[15px]">
            Cold-chain vans running daily routes. Same-day delivery on orders before 2 PM.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-2.5 sm:mt-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-3">
            {AREAS.map((area) => (
              <div
                key={area}
                className="flex items-center gap-2 rounded-4xl border bg-white p-2 shadow-2xs"
              >
                <MapPin
                  color="#E86B32"
                  className="text-brand h-2.5 w-2.5 shrink-0 rounded-full font-bold"
                />
                <span className="text-ink text-xs sm:text-sm">{area}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-neutral-200 sm:h-80 lg:h-95">
          <iframe
            title="ChunkNChop Lagos delivery coverage map"
            className="h-full w-full grayscale-15"
            loading="lazy"
            src="https://www.openstreetmap.org/export/embed.html?bbox=3.3200%2C6.4300%2C3.4600%2C6.5300&layer=mapnik&marker=6.4550%2C3.3900"
          />
        </div>
      </div>
    </section>
  );
}