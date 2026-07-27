'use client';

import { CATEGORIES } from '@/lib/categories';

interface Props {
  active: string | 'All';
  onSelect: (cat: string | 'All') => void;
}

export default function CategoryPills({ active, onSelect }: Props) {
  const items: (string | 'All')[] = ['All', ...CATEGORIES];

  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto py-1">
      {items.map((item) => {
        const isActive = active === item;

        return (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            aria-pressed={isActive}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand text-white shadow-sm'
                : 'border border-white bg-white text-[#1A1A1A] shadow ring-1 ring-inset ring-white hover:bg-ember-50'
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}