
import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';

export default function Header({ cartCount }: { cartCount: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <div className="flex h-8 items-center justify-between bg-[#24231f] px-[7.1%] text-[9px] font-semibold tracking-[0.13em] text-[#f7f5ef] max-[650px]:h-[29px] max-[650px]:justify-center max-[650px]:px-3 max-[650px]:text-[8px]">
        <span>GOOD FOOD STARTS WITH GOOD SOURCING.</span>

        <span className="flex items-center gap-2 text-[#e7c7a7] max-[650px]:hidden">
          <Truck size={14} />
          THOUGHTFULLY SOURCED, CAREFULLY CUT
        </span>
      </div>

      <header className="relative z-[5] flex h-20 items-center justify-between border-b border-[#efeee9] bg-white px-[7.1%] max-[650px]:h-[67px] max-[650px]:px-[5%]">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="ChunknChop home"
        >
          <span className="whitespace-nowrap text-[11px] font-bold tracking-[0.17em]">
            ChunknChop
          </span>
        </Link>

        <nav
          className={`flex items-center gap-[39px] text-[12px] text-[#484741] [&>a]:flex [&>a]:items-center [&>a]:gap-1 [&>a:hover]:text-[#e86b3e] max-[650px]:absolute max-[650px]:right-0 max-[650px]:top-[66px] max-[650px]:left-0 max-[650px]:hidden max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-[18px] max-[650px]:border-b max-[650px]:border-[#eae9e5] max-[650px]:bg-white max-[650px]:px-[5%] max-[650px]:py-[19px] ${
            menuOpen ? 'max-[650px]:flex' : ''
          }`}
          aria-label="Main navigation"
        >
          <Link href="/shop" onClick={() => setMenuOpen(false)}>
            Shop all
          </Link>

          <Link href="#categories" onClick={() => setMenuOpen(false)}>
            Our cuts <ChevronDown size={13} />
          </Link>

          <Link href="#story" onClick={() => setMenuOpen(false)}>
            Our story
          </Link>
        </nav>

        <div className="flex items-center gap-[25px] max-[650px]:gap-[17px] [&>a]:flex [&>a]:items-center">
          <Link
            href="#shop"
            className="text-[#4c4a45]"
            aria-label="Search products"
          >
            <Search size={19} />
          </Link>

          <Link
            href="/account"
            className="text-[12px] hover:text-[#e86b3e] max-[650px]:hidden"
          >
            Account
          </Link>

          <Link
            href="/cart"
            className="relative"
            aria-label={`Shopping bag, ${cartCount} ${
              cartCount === 1 ? 'item' : 'items'
            }`}
          >
            <ShoppingBag size={19} />

            <span className="absolute -top-[9px] -right-[11px] grid h-4 min-w-4 place-items-center rounded-full bg-[#e86b3e] px-1 text-[9px] text-white">
              {cartCount}
            </span>
          </Link>

          <button
            className="hidden cursor-pointer border-0 bg-transparent p-[3px] max-[650px]:block"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
