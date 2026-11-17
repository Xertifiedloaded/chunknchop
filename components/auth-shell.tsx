
import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-[#f8f8f6] text-[#24231f]">
      <header className="relative flex min-h-[76px] items-center justify-between border-b border-[#e6e4de] px-5 sm:px-8 lg:px-[7%]">
        <Link
          href="/"
          className="text-[10px] font-bold tracking-[0.12em] text-[#77736d] transition-colors hover:text-[#e86b3e]"
        >
          BACK TO SHOP
        </Link>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-heading text-lg font-bold tracking-[0.08em] text-[#24231f] sm:text-xl"
        >
          ChunknChop
        </Link>

        <span aria-hidden="true" />
      </header>

      <section className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8 sm:py-16">
        {children}
      </section>

      <footer className="flex flex-col items-center justify-between gap-4 border-t border-[#e6e4de] px-5 py-7 text-center sm:flex-row sm:px-8 lg:px-[7%]">
        <span className="font-heading text-sm font-bold tracking-wide text-[#24231f]">
          ChunknChop
        </span>

        <span className="text-[9px] font-bold tracking-[0.18em] text-[#88847d]">
          GOOD MEAT. GOOD LIVING.
        </span>

        <Link
          href="/shop"
          className="text-[10px] font-bold tracking-[0.12em] text-[#77736d] transition-colors hover:text-[#e86b3e]"
        >
          SHOP THE COUNTER
        </Link>
      </footer>
    </main>
  );
}
