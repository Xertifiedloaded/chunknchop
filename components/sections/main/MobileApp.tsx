'use client';
import Image from 'next/image';
import MobileIcon from '@/assets/mobile.svg';
import Link from 'next/link';

export default function MobileAppPromo() {
  return (
    <section className="bg-brand-foreground w-full">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <div className="bg-charcoal relative overflow-hidden rounded-[32px]">
          <div className="grid grid-cols-1 items-center gap-10 px-6 py-12 sm:px-10 sm:py-14 md:grid-cols-2 md:gap-8 lg:px-16 lg:py-8">
            <div className="text-center lg:text-left">
              <p className="text-brand text-xs font-bold tracking-wider">MOBILE APP</p>
              <h2 className="font-sora text-brand-foreground mt-3 text-3xl leading-tight font-extrabold sm:text-4xl">
                Order in seconds.
                <br />
                <span className="text-[#E67E51]">Track</span> to your door.
              </h2>
              <p className="font-worksans mx-auto mt-4 max-w-sm text-sm leading-relaxed text-neutral-400 lg:mx-0">The ChunkNChop app: faster reorders, saved cuts, delivery tracking and app-only drops.</p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap lg:justify-start">
                <Link href="#" className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-black px-4 py-2.5 transition-colors hover:border-neutral-500 sm:w-auto sm:justify-start">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0">
                    <path fill="#00d2ff" d="M3 3.5v17c0 .3.1.5.3.7L13 12 3.3 2.8c-.2.2-.3.4-.3.7z" />
                    <path fill="#00f076" d="M13 12l3.6-3.6-9-5.1L3.3 2.8 13 12z" />
                    <path fill="#ff3a44" d="M13 12l-9.7 9.7 3.3-1.7 9-5.1L13 12z" />
                    <path fill="#ffbc00" d="M20.3 10.6l-3.7-2.2L13 12l3.6 3.6 3.7-2.2c.5-.4.5-2.4 0-2.8z" />
                  </svg>
                  <span className="text-left leading-none">
                    <span className="block text-[9px] text-neutral-400">GET IT ON</span>
                    <span className="text-brand-foreground block text-sm font-semibold">Google Play</span>
                  </span>
                </Link>

                <Link href="#" className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-black px-4 py-2.5 transition-colors hover:border-neutral-500 sm:w-auto sm:justify-start">
                  <svg viewBox="0 0 24 24" className="fill-brand-foreground h-6 w-6 shrink-0">
                    <path d="M16.365 1.43c0 1.14-.463 2.101-1.02 2.79-.632.78-1.577 1.334-2.435 1.264-.126-1.09.43-2.235 1.03-2.94.653-.767 1.79-1.36 2.425-1.114zm3.16 16.35c-.323.744-.703 1.457-1.148 2.135-.62.937-1.128 1.585-1.517 1.94-.61.577-1.264.872-1.966.886-.507.008-1.113-.144-1.82-.454-.71-.312-1.362-.464-1.958-.464-.62 0-1.29.152-2.008.464-.72.31-1.302.472-1.75.484-.673.026-1.34-.278-1.998-.912-.42-.398-.964-1.088-1.634-2.07-.72-1.053-1.31-2.276-1.774-3.667-.494-1.502-.742-2.958-.742-4.37 0-1.62.35-3.017 1.05-4.188.55-.94 1.28-1.68 2.196-2.222.916-.542 1.906-.826 2.973-.85.53 0 1.223.164 2.084.487.86.324 1.412.488 1.657.488.183 0 .793-.19 1.83-.57.977-.353 1.802-.5 2.478-.442 1.83.148 3.205.87 4.12 2.17-1.638.99-2.448 2.378-2.43 4.157.017 1.386.517 2.538 1.498 3.45.446.42.943.746 1.492.977-.12.35-.246.685-.38 1.007z" />
                  </svg>
                  <span className="text-left leading-none">
                    <span className="block text-[9px] text-neutral-400">Download on the</span>
                    <span className="text-brand-foreground block text-sm font-semibold">App Store</span>
                  </span>
                </Link>
              </div>
            </div>

            <div className="relative mx-auto h-65 w-full max-w-55 sm:h-80 sm:max-w-65 md:h-90 md:max-w-70 lg:h-105 lg:max-w-none lg:justify-self-end">
              <Image src={MobileIcon} alt="ChunkNChop app screen showing the home feed with featured products and categories" fill className="object-cover object-bottom lg:object-center" sizes="(max-width: 768px) 220px, (max-width: 1024px) 280px, 320px" priority />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
