'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Image from 'next/image';

import hero from '@/assets/hero.png';
import { BADGES, FEATURES } from '@/lib';


function Badge({ label }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm sm:gap-2 sm:px-4 sm:py-2 sm:text-xs">
      <CheckCircle size={14} className="shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}

export default function Hero({ title, paragraph, isCenter = false, features = true, shopHref = '/shop', categoriesHref = '/categories' }) {
  const centerOnly = isCenter && !features;
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section className="bg-brand-foreground relative w-full">
      <div className="from-ink to-ink/80 relative min-h-140 w-full overflow-hidden bg-gradient-to-br sm:min-h-160 lg:min-h-180">
        {!imageFailed && (
          <Image
            src={hero}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        )}
        <div className="from-ink/70 pointer-events-none absolute inset-0 bg-linear-to-t via-transparent to-transparent" />

        <div
          className={
            centerOnly
              ? 'absolute inset-0 mx-auto flex max-w-7xl flex-col items-center justify-center px-6 text-center lg:px-10'
              : `relative mx-auto flex h-full max-w-7xl flex-col justify-center px-6 py-16 sm:py-20 lg:px-10 lg:py-24 ${isCenter ? 'items-center text-center' : ''}`
          }
        >
          <div className={`max-w-2xl ${isCenter ? 'flex flex-col items-center justify-center text-center' : ''}`}>
            {centerOnly && (
              <div className="mb-6 flex flex-wrap justify-center gap-2 sm:gap-3">
                {BADGES.map((badge) => (
                  <Badge key={badge.label} label={badge.label} />
                ))}
              </div>
            )}

            <h1 className="font-sora text-4xl leading-[1.1] font-extrabold text-white sm:text-6xl lg:text-7xl lg:leading-[1.08]">
              {title}
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/85 sm:mt-6 sm:text-[15px]">{paragraph}</p>

            <div
              className={`mt-7 flex gap-3 sm:mt-8 sm:items-center sm:gap-4 ${
                isCenter ? 'flex-wrap justify-center' : 'flex-row sm:flex-wrap'
              }`}
            >
              <Link
                href={shopHref}
                className={`bg-brand text-brand-foreground hover:bg-brand/90 focus-visible:ring-brand flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-6 ${
                  isCenter ? 'flex-none' : 'flex-1 sm:flex-none'
                }`}
              >
                Shop Now
                <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
              </Link>
              <Link
                href={categoriesHref}
                className={`bg-brand-foreground text-ink hover:bg-neutral-100 focus-visible:ring-ink flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-6 ${
                  isCenter ? 'flex-none' : 'flex-1 sm:flex-none'
                }`}
              >
                Browse Categories
              </Link>
            </div>

            {!centerOnly && (
              <div className="mt-7 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
                {BADGES.map((badge) => (
                  <Badge key={badge.label} label={badge.label} />
                ))}
              </div>
            )}

            {features && (
              <div className="-mx-6 mt-7 flex snap-x snap-mandatory scrollbar-none gap-3 overflow-x-auto px-6 pb-1 [-ms-overflow-style:none] sm:hidden [&::-webkit-scrollbar]:hidden">
                {FEATURES.map(({ title: featureTitle, subtitle, icon: Icon }) => (
                  <div
                    key={featureTitle}
                    className="border-white/15 flex w-32 shrink-0 snap-start flex-col items-center gap-2 rounded-xl border bg-black/30 p-3 text-center backdrop-blur-sm"
                  >
                    <span className="bg-white/15 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <Icon size={16} className="text-brand" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold text-white">{featureTitle}</p>
                      <p className="mt-0.5 text-[9px] leading-snug text-white/70">{subtitle}</p>
                    </div>
                  </div>
                ))}
                <div className="w-3 shrink-0" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      </div>

      {features && (
        <div className="relative mx-auto -mt-8 hidden max-w-6xl px-4 sm:-mt-14 sm:block sm:px-6 lg:-mt-16 lg:px-10">
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-3 sm:gap-4 sm:p-6 lg:grid-cols-5">
            {FEATURES.map(({ title: featureTitle, subtitle, icon: Icon }) => (
              <div key={featureTitle} className="flex flex-col items-center gap-2 rounded-xl bg-[#F7F5F4] p-3 text-center sm:gap-3 sm:p-4">
                <span className="bg-brand/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12">
                  <Icon size={18} className="text-brand sm:hidden" strokeWidth={2} aria-hidden="true" />
                  <Icon size={22} className="text-brand hidden sm:block" strokeWidth={2} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-ink text-xs font-semibold sm:text-sm">{featureTitle}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-neutral-500 sm:text-[9px]">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}