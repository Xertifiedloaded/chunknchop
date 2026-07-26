'use client';

import { SearchX } from 'lucide-react';
import Image from 'next/image';
import Meat from '../assets/header-logo.svg';
export default function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-6 py-20 text-center shadow-lg">
      <div className="mb-4 flex items-center justify-center rounded-full">
        <Image src={Meat} height={20} width={20} alt="No products found" className="h-10 w-7xl" />
      </div>
      <h3 className="text-xs text-[#1A1A1A]">We couldn't find any products matching your</h3>
      <p className="mt-1 max-w-sm text-sm text-[#1A1A1A]">search.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 rounded-lg bg-[#E65A2D] px-8 py-2.5 text-sm text-white transition-colors"
      >
        Clear filters
      </button>
    </div>
  );
}
