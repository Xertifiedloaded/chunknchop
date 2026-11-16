import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <header className="catalog-top">
        <Link href="/" className="catalog-back">
          BACK TO SHOP
        </Link>
        <Link href="/" className="catalog-wordmark">
          ChunknChop
        </Link>
        <span />
      </header>
      <section className="auth-layout">{children}</section>
      <footer className="catalog-footer">
        <span>ChunknChop</span>
        <span>GOOD MEAT. GOOD LIVING.</span>
        <Link href="/shop">SHOP THE COUNTER</Link>
      </footer>
    </main>
  );
}
