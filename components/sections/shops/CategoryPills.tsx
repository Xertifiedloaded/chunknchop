'use client';

import React from 'react';

interface Props {
  active: string | 'All'; // display name
  onSelect: (slug: string) => void; // notify with slug so Shop can update URL/filters
}

export default function CategoryPills({ active, onSelect }: Props) {
  const [items, setItems] = React.useState<Array<{ name: string; slug: string }>>([{ name: 'All', slug: 'all' }]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to load categories');
        const data = await res.json();
        if (cancelled) return;
        setItems([{ name: 'All', slug: 'all' }, ...data.map((c: any) => ({ name: c.name, slug: c.slug }))]);
      } catch (err) {
        console.error('Failed to load category pills:', err);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto py-1">
      {items.map((item) => {
        const isActive = active === item.name;

        return (
          <button
            key={item.slug}
            type="button"
            onClick={() => onSelect(item.slug)}
            aria-pressed={isActive}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-brand text-white shadow-sm' : 'hover:bg-ember-50 border border-white bg-white text-[#1A1A1A] shadow ring-1 ring-white ring-inset'}`}>
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
