"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Breadcrumbs, { type Crumb } from "@/components/Breadcrumbs";
import { useCmsContent } from "@/lib/cms/useCmsContent";
import { DEFAULT_SLIDES, toHeroSlide, type HeroSlide } from "@/lib/cms/defaults";

const AUTOPLAY_MS = 5000;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function HomeHero({ slides: slidesProp, crumbs }: { slides?: HeroSlide[]; crumbs?: Crumb[] }) {
  const { data } = useCmsContent(slidesProp ? [] : ["HERO"]);

  const slides = useMemo(() => {
    if (slidesProp?.length) return slidesProp;
    const live = (data.HERO ?? []).map((h) => toHeroSlide(h.data)).filter((s) => s.image && s.lines.length);
    return live.length ? live : DEFAULT_SLIDES;
  }, [slidesProp, data.HERO]);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback((i: number) => setActive((i + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => goTo(active + 1), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [active, paused, goTo, slides.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) goTo(active + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  const current = active % slides.length;
  const slide = slides[current];

  return (
    <section
      className="relative isolate flex min-h-[85svh] w-full items-center justify-center overflow-hidden bg-[#241b19] font-worksans lg:min-h-[100svh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute inset-0 -z-10">
        {slides.map((s, i) => (
          <div
            key={`${s.image}-${i}`}
            aria-hidden={i !== current}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
            style={{ backgroundImage: `url(${s.image})` }}
          />
        ))}
        <div className="absolute inset-0 bg-[#211715]/60" />
        <div className="absolute inset-0 bg-linear-to-t from-[#100d0e]/70 via-transparent to-[#100d0e]/30" />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-20 text-center sm:px-8 lg:py-28">
        <Breadcrumbs crumbs={crumbs} className="mb-6 sm:mb-8" />

        <div key={current} className="flex animate-[heroFade_.6s_ease] flex-col items-center">
          <h1 className="max-w-4xl text-[clamp(2.25rem,9vw,4rem)] leading-[0.92] font-black tracking-[-1px] text-balance text-[#f7f1e9] uppercase lg:text-[clamp(3.5rem,6vw,6rem)] lg:tracking-[-2px]">
            {slide.lines.map((line, i) => (
              <span key={`${line}-${i}`} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-5 max-w-xl font-sora text-sm leading-relaxed text-[#e4dbd3] sm:mt-7 sm:text-base">{slide.text}</p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={() => scrollToId(slide.ctaTarget)} className="bg-brand px-6 py-3.5 text-sm font-black tracking-wide text-white transition hover:bg-[#a91f1b]">
            {slide.ctaLabel}
          </button>

          <button
            type="button"
            onClick={() => scrollToId(slide.secondaryTarget)}
            className="border border-white/70 px-6 py-3.5 text-sm font-black tracking-wide text-white transition hover:bg-white hover:text-black"
          >
            {slide.secondaryLabel}
          </button>
        </div>

        {slides.length > 1 && (
          <div className="mt-10 flex items-center justify-center gap-1" role="tablist" aria-label="Slides">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className="group flex h-6 w-6 items-center justify-center"
              >
                <span className={`block rounded-full transition-all duration-300 ${i === current ? "h-2 w-6 bg-white" : "h-1.5 w-1.5 bg-white/40 group-hover:bg-white/70"}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}