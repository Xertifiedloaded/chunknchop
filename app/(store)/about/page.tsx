'use client';

import Link from 'next/link';

import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Truck,
  Award,
  Leaf,
  Clock3,
  ShoppingBag,
  Scissors,
  Beef,
} from 'lucide-react';

const values = [
  {
    icon: Beef,
    title: 'Quality Meat',
    description:
      'We focus on providing carefully selected meat products that meet our quality standards.',
  },
  {
    icon: Scissors,
    title: 'Cut to Order',
    description:
      'Your meat is prepared with care and attention to the cuts and portions you request.',
  },
  {
    icon: ShieldCheck,
    title: 'Hygiene & Safety',
    description: 'We value clean handling, proper packaging and responsible food preparation.',
  },
  {
    icon: Truck,
    title: 'Reliable Delivery',
    description: 'We work to get your orders to your doorstep fresh, properly packed and on time.',
  },
];

const promises = [
  'Carefully selected meat products',
  'Fresh preparation and proper packaging',
  'Convenient online ordering',
  'Customer-focused service',
];

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#faf9f6] text-[#201a17]">
      {}
      <section className="relative overflow-hidden bg-[#100d0b] px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-12 lg:py-32">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#a45d3d]/15 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-[#a45d3d]/10 blur-[100px]" />

        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[2px] text-[#d6aa91]">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Our Story
            </span>

            <h1 className="mt-6 max-w-[600px] text-4xl font-black leading-[1.12] tracking-[-1.8px] sm:text-5xl lg:text-[58px]">
              Good food starts with
              <span className="block text-brand">good meat.</span>
            </h1>

            <p className="mt-6 max-w-[460px] text-[12px] leading-[2] text-[#b4a69d] sm:text-[13px]">
              At ChunkNChop, we believe that great meals begin with quality ingredients. We make
              buying fresh meat easier with carefully prepared cuts, convenient ordering and
              doorstep delivery.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-[11px] font-bold text-white transition hover:bg-[#a87358]"
              >
                Explore Our Shop
                <ArrowRight size={14} />
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-[11px] font-semibold text-white transition hover:border-brand hover:text-[#d6aa91]"
              >
                Contact Us
              </Link>
            </div>
          </div>

          {}
          <div className="relative mx-auto w-full max-w-[510px]">
            <div className="absolute -inset-3 rounded-[28px] border border-brand/20" />

            <div className="relative flex aspect-[5/4] items-center justify-center overflow-hidden rounded-[22px] bg-[#241914]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8d5138]/30 via-transparent to-black/50" />

              <div className="relative text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-brand/30 bg-brand/10 sm:h-32 sm:w-32">
                  <Beef size={55} strokeWidth={1} className="text-[#d2a58c] sm:h-16 sm:w-16" />
                </div>

                <p className="mt-6 text-[10px] font-bold uppercase tracking-[3px] text-[#d2a58c]">
                  ChunkNChop
                </p>
                <p className="mt-2 text-[11px] text-[#b4a69d]">Quality cuts. Better meals.</p>
              </div>

              <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-md">
                <p className="text-[9px] uppercase tracking-[1.5px] text-[#c8a18b]">
                  Our commitment
                </p>
                <p className="mt-1 text-[11px] font-semibold text-white">
                  Freshness in every order
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-[1100px] gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#a87358]">
              Who We Are
            </span>

            <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-1px] sm:text-4xl">
              Making quality meat shopping simpler.
            </h2>
          </div>

          <div className="space-y-4 text-[12px] leading-[2] text-[#766c65]">
            <p>
              ChunkNChop is built around a simple idea: getting quality meat should be convenient,
              straightforward and enjoyable.
            </p>

            <p>
              Whether you are preparing a family meal, stocking your kitchen or planning something
              special, we want to make finding and ordering the right meat easier.
            </p>

            <p>
              From selecting your products to preparing your order and arranging delivery, we aim to
              make every step a better experience.
            </p>
          </div>
        </div>
      </section>

      {}
      <section className="bg-[#f0ede8] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <div className="mx-auto max-w-[520px] text-center">
            <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#a87358]">
              What Matters to Us
            </span>

            <h2 className="mt-3 text-3xl font-black tracking-[-1px] sm:text-4xl">
              The ChunkNChop difference
            </h2>

            <p className="mt-3 text-[11px] leading-[1.9] text-[#766c65]">
              Everything we do is guided by our commitment to quality, convenience and customer
              satisfaction.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-[#e5dfd7] bg-[#faf9f6] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#241914]/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-[#a87358]">
                  <Icon size={19} strokeWidth={1.7} />
                </div>

                <h3 className="mt-5 text-[13px] font-bold">{title}</h3>

                <p className="mt-2 text-[11px] leading-[1.9] text-[#766c65]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="bg-[#100d0b] px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-[1100px] gap-12 md:grid-cols-2 md:items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[2px] text-brand">
              Our Promise
            </span>

            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-1px] sm:text-4xl">
              Every order deserves care.
            </h2>

            <p className="mt-4 max-w-[420px] text-[12px] leading-[2] text-[#a49a91]">
              We want every customer to feel confident when ordering from ChunkNChop. Our goal is to
              make quality, convenience and thoughtful service part of every experience.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex items-center gap-2 text-[11px] font-bold text-[#d6aa91] transition hover:text-white"
            >
              Shop with us
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h3 className="text-[13px] font-bold">What you can expect</h3>

            <div className="mt-6 space-y-5">
              {promises.map((promise) => (
                <div key={promise} className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand" />
                  <p className="text-[11px] leading-relaxed text-[#c1b5ad]">{promise}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-[#eee9e2] p-6">
              <ShoppingBag size={22} className="text-[#a87358]" />
              <h3 className="mt-4 text-[13px] font-bold">Easy Ordering</h3>
              <p className="mt-2 text-[11px] leading-[1.9] text-[#766c65]">
                Browse our products and place your order conveniently online.
              </p>
            </div>

            <div className="rounded-2xl border border-[#eee9e2] p-6">
              <Heart size={22} className="text-[#a87358]" />
              <h3 className="mt-4 text-[13px] font-bold">Customer First</h3>
              <p className="mt-2 text-[11px] leading-[1.9] text-[#766c65]">
                We value your trust and work to make your shopping experience worthwhile.
              </p>
            </div>

            <div className="rounded-2xl border border-[#eee9e2] p-6">
              <Clock3 size={22} className="text-[#a87358]" />
              <h3 className="mt-4 text-[13px] font-bold">Convenience</h3>
              <p className="mt-2 text-[11px] leading-[1.9] text-[#766c65]">
                Spend less time sourcing meat and more time enjoying your meals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12">
        <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-3xl bg-brand px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full border border-white/10" />

          <div className="relative">
            <span className="text-[9px] font-bold uppercase tracking-[2px] text-white/75">
              Good food begins here
            </span>

            <h2 className="mt-3 text-3xl font-black tracking-[-1px] sm:text-4xl">
              Ready to shop better?
            </h2>

            <p className="mx-auto mt-3 max-w-[420px] text-[11px] leading-[1.9] text-white/80">
              Explore our selection and get your next meal started with ChunkNChop.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#100d0b] px-7 py-3.5 text-[11px] font-bold text-white transition hover:bg-[#28201b]"
            >
              Start Shopping
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
