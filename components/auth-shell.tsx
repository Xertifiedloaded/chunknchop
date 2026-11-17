import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-[#f8f8f6] text-[#24231f]">
      <section className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8 sm:py-16">
        {children}
      </section>
    </main>
  );
}
