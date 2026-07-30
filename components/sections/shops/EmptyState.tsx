'use client';

import Image from 'next/image';
import Meat from '@/assets/knife.png';

interface EmptyStateProps {
  onClear: () => void;
}

export default function EmptyState({ onClear }: EmptyStateProps) {
  return (
    <div className="flex min-h-87.5 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white px-5 py-12 text-center shadow-sm sm:min-h-[400px] sm:px-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
        <Image src={Meat} alt="No products found" width={28} height={28} className="h-9 w-9 object-contain" />
      </div>

      <h3 className="mt-5 text-base font-semibold text-[#1A1A1A]">No products found</h3>

      <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-500 sm:max-w-md">We couldn't find any products matching your current search or filters.</p>

      <button type="button" onClick={onClear} className="mt-6 w-full max-w-50 rounded-lg bg-[#E65A2D] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#d94f25] focus:ring-2 focus:ring-[#E65A2D] focus:ring-offset-2 focus:outline-none sm:w-auto">
        Clear filters
      </button>
    </div>
  );
}
