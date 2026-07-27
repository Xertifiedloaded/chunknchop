'use client';

import { CATEGORIES } from '@/lib/categories';

interface Props {
  active: string | 'All';
  onSelect: (cat: string | 'All') => void;
}

export default function CategoryPills({ active, onSelect }: Props) {
  const items: (string | 'All')[] = ['All', ...CATEGORIES];

  return (
    <div className="flex scrollbar-thin gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
      {items.map((item) => {
        const isActive = active === item;
        return (
          <button key={item} type="button" onClick={() => onSelect(item)} aria-pressed={isActive} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-[#E65C2E] text-white shadow-sm' : 'hover:bg-ember-50 border border-white bg-white text-[#1A1A1A] shadow ring-1 ring-white ring-inset'}`}>
            {item}
          </button>
        );
      })}
    </div>
  );
}
