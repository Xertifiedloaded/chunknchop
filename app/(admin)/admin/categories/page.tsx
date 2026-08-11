'use client';

import { ChevronDown, GripVertical, Plus, RotateCcw } from 'lucide-react';

interface Category {
  name: string;
  slug: string;
  products: number;
  revenue: string;
  share: number;
  color: string;
  visible: boolean;
}

const categories: Category[] = [
  {
    name: 'Chicken',
    slug: '/chicken',
    products: 24,
    revenue: '41.2M',
    share: 26,
    color: '#f45d27',
    visible: true,
  },
  {
    name: 'Beef',
    slug: '/beef',
    products: 31,
    revenue: '50.8M',
    share: 32,
    color: '#781c2d',
    visible: true,
  },
  {
    name: 'Seafood',
    slug: '/seafood',
    products: 18,
    revenue: '25.4M',
    share: 16,
    color: '#f5a400',
    visible: true,
  },
  {
    name: 'Goat',
    slug: '/goat',
    products: 12,
    revenue: '17.4M',
    share: 11,
    color: '#918a83',
    visible: true,
  },
  {
    name: 'Turkey',
    slug: '/turkey',
    products: 9,
    revenue: '9.1M',
    share: 6,
    color: '#b8b3ad',
    visible: true,
  },
  {
    name: 'Pork',
    slug: '/pork',
    products: 11,
    revenue: '7.6M',
    share: 5,
    color: '#f2764c',
    visible: false,
  },
  {
    name: 'Sausages',
    slug: '/sausages',
    products: 14,
    revenue: '14.2M',
    share: 9,
    color: '#18c768',
    visible: true,
  },
  {
    name: 'BBQ',
    slug: '/bbq',
    products: 7,
    revenue: '11.8M',
    share: 7,
    color: '#b73e13',
    visible: true,
  },
  {
    name: 'Dairy',
    slug: '/dairy',
    products: 16,
    revenue: '5.3M',
    share: 3,
    color: '#625b54',
    visible: true,
  },
  {
    name: 'Frozen',
    slug: '/frozen',
    products: 22,
    revenue: '8.9M',
    share: 6,
    color: '#37332f',
    visible: true,
  },
  {
    name: 'Spices',
    slug: '/spices',
    products: 19,
    revenue: '3.4M',
    share: 2,
    color: '#ff9679',
    visible: true,
  },
];

function CategoryCard({ category }: { category: Category }) {
  return (
    <article className="group relative min-w-0 overflow-hidden rounded-[17px] border border-[#e8e5e2] bg-white shadow-[0_3px_12px_rgba(0,0,0,0.035)] transition-shadow duration-200 hover:shadow-[0_5px_18px_rgba(0,0,0,0.07)]">
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: category.color }} />

      <div className="p-4 pt-[18px] sm:p-[18px] sm:pt-[19px]">
        {/* Name */}
        <div className="flex items-start gap-2">
          <GripVertical size={14} strokeWidth={2} className="mt-[3px] shrink-0 text-[#d5d1cd]" />

          <div className="min-w-0">
            <h3 className="truncate text-[14px] leading-[17px] font-semibold text-[#2f2d2b]">{category.name}</h3>

            <p className="mt-[1px] text-[11px] leading-[14px] text-[#99938d]">{category.slug}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-[14px] grid grid-cols-2 gap-[10px]">
          <div className="min-w-0 rounded-[14px] bg-[#f5f5f4] px-[12px] py-[9px]">
            <p className="text-[9px] leading-[12px] font-medium text-[#8f8983]">Products</p>

            <p className="mt-[3px] text-[15px] leading-[17px] font-bold tracking-[-0.2px] text-[#36322f]">{category.products}</p>
          </div>

          <div className="min-w-0 rounded-[14px] bg-[#f5f5f4] px-[12px] py-[9px]">
            <p className="text-[9px] leading-[12px] font-medium text-[#8f8983]">Revenue</p>

            <p className="mt-[3px] truncate text-[15px] leading-[17px] font-bold tracking-[-0.2px] text-[#36322f]">▣{category.revenue}</p>
          </div>
        </div>

        {/* Revenue share */}
        <div className="mt-[12px]">
          <div className="mb-[5px] flex items-center justify-between">
            <span className="text-[10px] font-medium text-[#98918b]">Share of revenue</span>

            <span className="text-[10px] font-semibold text-[#4b4744]">{category.share}%</span>
          </div>

          <div className="h-[5px] overflow-hidden rounded-full bg-[#e8e6e4]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${category.share * 3.85}%`,
                backgroundColor: category.color,
              }}
            />
          </div>
        </div>

        {/* Status */}
        <div className="mt-[14px]">
          {category.visible ? (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-[#e9faf2] px-[9px] py-[4px] text-[9px] leading-none font-semibold text-[#0da45b]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#13c76b]" />
              Visible in storefront
            </span>
          ) : (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-[#eeeceb] px-[9px] py-[4px] text-[9px] leading-none font-semibold text-[#756f69]">
              <span className="h-[5px] w-[5px] rounded-full bg-[#918a84]" />
              Hidden
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function RuleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-[#e7e3df] bg-white px-[14px] py-[13px]">
      <h3 className="text-[11px] font-bold text-[#36322f]">{title}</h3>

      <p className="mt-[5px] text-[10px] leading-[15px] text-[#8d8781]">{children}</p>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f9] px-4 py-5 text-[#302d2a] sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1320px]">
        {/* Header */}
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[21px] leading-[25px] font-bold tracking-[-0.4px] text-[#292725]">Categories</h1>

            <p className="mt-[7px] text-[12px] leading-[17px] text-[#908a85]">Organise the catalogue into the eleven storefront categories customers browse by.</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button type="button" className="inline-flex h-[35px] items-center justify-center rounded-[11px] border border-[#ddd9d5] bg-white px-[14px] text-[11px] font-semibold text-[#4a4642] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:bg-[#fafafa]">
              Reorder
            </button>

            <button type="button" className="inline-flex h-[35px] items-center justify-center gap-[7px] rounded-[11px] bg-[#f3652a] px-[14px] text-[11px] font-semibold text-white shadow-[0_2px_5px_rgba(243,101,42,0.2)] transition hover:bg-[#e9581f]">
              <Plus size={15} strokeWidth={2.5} />
              New Category
            </button>
          </div>
        </header>

        {/* Category grid */}
        <section className="grid grid-cols-1 gap-[14px] md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </section>

        {/* Rules */}
        <section className="mt-[21px] rounded-[17px] border border-[#e8e5e2] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] sm:p-[18px]">
          <div>
            <h2 className="text-[13px] leading-[16px] font-bold text-[#3a3633]">Category rules</h2>

            <p className="mt-[3px] text-[10px] leading-[14px] text-[#99928c]">How categories behave across the storefront and processing floor</p>
          </div>

          <div className="mt-[13px] grid grid-cols-1 gap-[10px] lg:grid-cols-3">
            <RuleCard title="Preparation defaults">Each category carries default preparation options that pre-fill on new products.</RuleCard>

            <RuleCard title="Cold-chain class">Frozen and Seafood are routed to blast freezers; Dairy holds at 0–4°C.</RuleCard>

            <RuleCard title="Storefront ordering">Menu order follows this list — drag to reorder and publish instantly.</RuleCard>
          </div>
        </section>
      </div>
    </main>
  );
}
