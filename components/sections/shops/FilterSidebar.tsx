"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import { X } from "lucide-react";
import { PREPARATIONS } from "@/lib/categories";
import { formatNaira } from "@/lib/format";
import { FilterState, PRICE_MAX, PRICE_MIN } from "@/lib/filters";
import { useCategories } from "@/lib/hooks/useCategories";

interface Props {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onClearAll: () => void;
  className?: string;
  hideHeader?: boolean;
}

type AvailabilityKey = "inStock" | "sameDayDelivery" | "newArrival" | "bestSeller";

const AVAILABILITY_OPTIONS: { key: AvailabilityKey; label: string }[] = [
  { key: "inStock", label: "In Stock" },
  { key: "sameDayDelivery", label: "Same Day Delivery" },
  { key: "newArrival", label: "New Arrival" },
  { key: "bestSeller", label: "Best Seller" },
];

const OPTION_CLASS =
  "text-charcoal flex cursor-pointer items-center gap-2.5 text-sm";

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-ink mb-3 text-sm font-semibold">{children}</h3>;
}

function Option({
  type,
  name,
  checked,
  onChange,
  children,
}: {
  type: "radio" | "checkbox";
  name?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className={OPTION_CLASS}>
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`text-brand h-4 w-4 ${type === "checkbox" ? "rounded" : ""}`}
      />
      {children}
    </label>
  );
}

export default function FilterSidebar({
  filters,
  onChange,
  onClearAll,
  className = "",
  hideHeader = false,
}: Props) {
  const { categories } = useCategories();

  const update = (patch: Partial<FilterState>) =>
    onChange({ ...filters, ...patch });

  const togglePreparation = (value: string) => {
    const current = filters.preparations ?? [];
    update({
      preparations: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  const rangeProgress = Math.round(
    ((filters.maxPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100,
  );

  return (
    <aside className={`flex flex-col ${className}`}>
      {!hideHeader && (
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-ink text-base font-semibold">Filters</h2>
          <button
            type="button"
            onClick={onClearAll}
            className="hover:text-ember-700 text-sm font-medium text-[#E65C2E] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="divide-ink/5 flex flex-col divide-y [&>section]:py-5 [&>section:first-child]:pt-0">
        <section>
          <SectionTitle>Categories</SectionTitle>
          <div className="flex flex-col gap-2.5">
            <Option
              type="radio"
              name="category"
              checked={filters.category === "All"}
              onChange={() => update({ category: "All" })}
            >
              All
            </Option>
            {categories.map(({ name }) => (
              <Option
                key={name}
                type="radio"
                name="category"
                checked={filters.category === name}
                onChange={() => update({ category: name })}
              >
                {name}
              </Option>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Price</SectionTitle>
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={500}
            value={filters.maxPrice}
            style={{ "--range-progress": `${rangeProgress}%` } as CSSProperties}
            onChange={(e) => update({ maxPrice: Number(e.target.value) })}
            className="w-full"
            aria-label="Maximum price"
          />
          <div className="text-ink mt-2 flex items-center justify-between text-xs font-medium">
            <span>{formatNaira(PRICE_MIN)}</span>
            <span>{formatNaira(filters.maxPrice)}</span>
          </div>
        </section>

        <section>
          <SectionTitle>Preparation</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {PREPARATIONS.map((prep) => (
              <Option
                key={prep}
                type="checkbox"
                checked={(filters.preparations ?? []).includes(prep)}
                onChange={() => togglePreparation(prep)}
              >
                {prep}
              </Option>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Availability</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {AVAILABILITY_OPTIONS.map(({ key, label }) => (
              <Option
                key={key}
                type="checkbox"
                checked={Boolean(filters[key])}
                onChange={(checked) => update({ [key]: checked })}
              >
                {label}
              </Option>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

export function MobileFilterDrawer({
  open,
  onClose,
  filters,
  onChange,
  onClearAll,
}: {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onClearAll: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="bg-ink/40 absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="absolute inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col bg-white shadow-2xl"
      >
        <div className="border-ink/10 flex items-center justify-between border-b px-5 py-4">
          <span className="text-ink text-base font-semibold">Filters</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="hover:bg-ink/5 text-charcoal flex h-9 w-9 items-center justify-center rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5">
          <FilterSidebar
            filters={filters}
            onChange={onChange}
            onClearAll={onClearAll}
            hideHeader
          />
        </div>

        <div className="border-ink/10 grid grid-cols-2 gap-2 border-t px-5 py-3">
          <button
            type="button"
            onClick={onClearAll}
            className="text-ink h-10 rounded-lg border border-[#dedbd7] text-sm font-medium"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-brand h-10 rounded-lg text-sm font-medium text-white"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}