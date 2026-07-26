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
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:px-10">
        <div>
          <p className="text-xs font-bold tracking-wider text-[#E86B32]">DELIVERY COVERAGE</p>
          <h2 className="mt-3 text-4xl leading-tight font-extrabold text-black sm:text-[42px]">
            We deliver fresh across Lagos.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-neutral-500">
            Cold-chain vans running daily routes. Same-day delivery on orders before 2 PM.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-x-6 gap-y-3">
            {AREAS.map((area) => (
              <div
                key={area}
                className="flex items-center gap-2 rounded-4xl border bg-white p-2 shadow-2xs"
              >
                <MapPin
                  color="#E86B32"
                  className="h-2.5 w-2.5 shrink-0 rounded-full font-bold text-[#E86B32]"
                />
                <span className="text-sm text-[#334155]">{area}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-neutral-200 sm:h-95">
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
