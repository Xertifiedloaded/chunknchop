'use client';

import type { ReactNode } from 'react';
import { CalendarDays, ChevronDown, Download, Filter, Search, SlidersHorizontal } from 'lucide-react';

export function Button({ children, onClick, variant = 'secondary', className = '' }: { children: ReactNode; onClick?: () => void; variant?: 'secondary' | 'primary'; className?: string }) {
  const base = 'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold transition-colors';
  const variants: Record<string, string> = {
    secondary: 'border border-[var(--color-line)] bg-white text-charcoal hover:bg-[#f7f6f5]',
    primary: 'bg-brand text-white hover:opacity-90',
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full sm:w-auto">
      <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[#b7b0a9]" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" suppressHydrationWarning className="text-charcoal focus:border-brand focus:ring-brand/10 h-8 w-full rounded-lg border border-[var(--color-line)] bg-white pr-3 pl-8 text-xs outline-none placeholder:text-[#aaa39c] focus:ring-2 sm:w-52" />
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-line)] p-3">{children}</div>;
}

export function FilterButton({ children = 'Filters' }: { children?: ReactNode }) {
  return (
    <Button>
      <SlidersHorizontal size={14} />
      {children}
    </Button>
  );
}

export function SelectButton({ children }: { children: ReactNode }) {
  return (
    <button className="text-charcoal inline-flex h-8 w-full min-w-0 items-center justify-between gap-2.5 rounded-lg border border-[var(--color-line)] bg-white px-2.5 text-xs sm:w-auto sm:min-w-[90px] sm:gap-4">
      <span className="min-w-0 truncate">{children}</span>
      <ChevronDown size={13} className="shrink-0 text-[#8d867f]" />
    </button>
  );
}

export function DateButton({ children = 'Aug 1 – Aug 7, 2026' }: { children?: ReactNode }) {
  return (
    <SelectButton>
      <span className="flex min-w-0 items-center gap-1.5">
        <CalendarDays size={13} className="shrink-0" />
        <span className="truncate">{children}</span>
      </span>
    </SelectButton>
  );
}

export function ExportButton() {
  return (
    <Button>
      <Download size={14} />
      Export
    </Button>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-charcoal text-base font-bold tracking-[-.02em] sm:text-lg">{title}</h1>
        {description && <p className="text-ink mt-1 max-w-3xl text-xs leading-5">{description}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const key = value.toLowerCase().replaceAll('_', ' ');
  const styles: Record<string, string> = {
    pending: 'bg-[#fff5dc] text-[#b47700]',
    preparing: 'bg-[#fff0e8] text-brand',
    'quality check': 'bg-[#f9eaf0] text-[#7a233d]',
    packaging: 'bg-[#eeecea] text-[#6f6861]',
    'ready for dispatch': 'bg-[#e8f6ff] text-[#087fbe]',
    'out for delivery': 'bg-[#e8f6ff] text-[#087fbe]',
    delivered: 'bg-[#e8f8f1] text-[#07835a]',
    cancelled: 'bg-[#fff0f0] text-[#c93232]',
    refunded: 'bg-[#f0eff0] text-[#67615d]',
    paid: 'bg-[#e8f8f1] text-[#07835a]',
    failed: 'bg-[#fff0f0] text-[#c93232]',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold whitespace-nowrap capitalize ${styles[key] || 'text-ink bg-[#f0efed]'}`}>
      <span className="h-1 w-1 shrink-0 rounded-full bg-current" />
      {key}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-[var(--color-line)] bg-white ${className}`}>{children}</div>;
}

export function Avatar({ name = 'User', className = '' }: { name?: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return <span className={`text-brand inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#fff0e8] text-[9px] font-bold ${className}`}>{initials}</span>;
}

export function Money({ value, compact = false }: { value: number; compact?: boolean }) {
  return <span>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0, notation: compact ? 'compact' : 'standard' }).format(value)}</span>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-charcoal font-semibold">{title}</p>
      <p className="text-ink mt-1 text-xs">{description}</p>
    </div>
  );
}
