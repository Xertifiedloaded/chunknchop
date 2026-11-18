import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export default function EmptyCart() {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center border border-dashed border-[#e9e5df] bg-white px-5 py-12 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#faf5ef]">
        <ShoppingBag size={26} strokeWidth={1.5} className="text-brand" />
      </div>

      <span className="mb-2 font-heading text-2xl font-semibold tracking-tight text-brand">
        ChunknChop
      </span>

      <h2 className="m-0 font-heading text-lg font-semibold tracking-tight text-[#292722] sm:text-xl">
        Your bag is taking a breather.
      </h2>

      <p className="mt-2 max-w-xs text-[13px] leading-6 text-[#89857e]">
        Nothing delicious in your bag yet. Find something good for the table.
      </p>

      <Link
        href="/shop"
        className="mt-6 inline-flex min-h-10 items-center justify-center gap-2.5 bg-brand px-6 py-3 text-[10px] font-semibold tracking-[0.12em] text-white transition-all duration-300 hover:bg-[#a9442c] hover:shadow-md"
      >
        EXPLORE THE CUTS
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center bg-white px-5 py-10">
      <div className="flex flex-col items-center">
        <div className="relative mb-5 flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-[1.5px] border-brand/10 border-t-brand" />

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf3ed]">
            <ShoppingBag size={19} strokeWidth={1.5} className="text-brand" />
          </div>
        </div>

        <p className="text-sm font-semibold tracking-tight text-[#292722]">
          Chunk<span className="text-brand">N</span>Chop
        </p>

        <p className="mt-1.5 text-xs text-[#89857e]">Getting the best products for you</p>

        <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1 w-1 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-brand" />
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          Loading products. Please wait.
        </span>
      </div>
    </div>
  );
}
