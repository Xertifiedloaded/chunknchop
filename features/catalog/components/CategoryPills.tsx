"use client";

import { useMemo } from "react";
import { useCategories } from "@/features/catalog/hooks/useCategories";

interface Props {
  active: string;
  onSelect: (slug: string) => void;
}

export default function CategoryPills({ active, onSelect }: Props) {
  const { categories, loading } = useCategories();

  const items = useMemo(() => [{ name: "All", slug: "all" }, ...categories], [categories]);

  return (
    <div role="group" aria-label="Product categories" className="scrollbar-hide flex gap-2 overflow-x-auto py-1">
      {items.map(({ name, slug }) => {
        const isActive = active === name;

        return (
          <button
            key={slug}
            type="button"
            onClick={() => onSelect(slug)}
            aria-pressed={isActive}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors sm:text-sm ${
              isActive ? "bg-brand text-white shadow-sm" : "hover:bg-ember-50 bg-white text-[#1A1A1A] shadow-sm"
            }`}
          >
            {name}
          </button>
        );
      })}

      {loading && [1, 2, 3].map((i) => <span key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-white/70" />)}
    </div>
  );
}
