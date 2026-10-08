"use client";


import Header from "@/components/sections/common/Header";
import { categories, slides, faqs, highlights } from "@/lib";
import { useProductStore } from "@/lib/store/productStore";
import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import BestSellerCard from "@/components/sections/BestSellerCard";
import { fetchWithAuth } from "@/lib/fetchClient";
import Breadcrumbs, { type Crumb } from "@/components/Breadcrumbs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const AUTOPLAY_MS = 5000;
const formatPrice = (price: number | string) =>
  typeof price === "number" ? `₦${price.toLocaleString("en-NG")}` : price;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const BEST_SELLER_COUNT = 4;
export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(false);

  const products = useProductStore((s) => s.products);
  const setProducts = useProductStore((s) => s.setProducts);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (
      !isHydrated ||
      !user ||
      user.role === "SUPPLIER" ||
      user.role === "STAFF"
    ) {
      setWishlistIds(new Set());
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetchWithAuth("/api/customer/wishlist", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = data.wishlist ?? data.items ?? data.products ?? [];
        if (!cancelled) {
          setWishlistIds(
            new Set(list.map((i: any) => i.productId ?? i.product?.id ?? i.id)),
          );
        }
      } catch (error) {
        console.error("failed to load wishlist:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, user]);
  useEffect(() => {
    if (products.length > 0) return;

    let cancelled = false;

    async function loadProducts() {
      try {
        setIsLoadingProducts(true);
        setProductsError(false);

        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();
        if (cancelled) return;

        setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        if (!cancelled) setProductsError(true);
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bestSellers = useMemo(() => {
    const flagged = products.filter((p) => p.isBestSeller);
    return (flagged.length ? flagged : products).slice(0, BEST_SELLER_COUNT);
  }, [products]);
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });

    setMobileMenu(false);
  };

  return (
    <main className="min-h-screen bg-[#17110f] text-[#f8f3eb]">
      <HomeHero />

      <section className="overflow-hidden bg-ink">
        <div className="marquee-track flex w-max">
          {[...highlights, ...highlights].map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex h-14.5 shrink-0 items-center justify-center whitespace-nowrap border-b border-[#100d0e]/10 px-8 text-center text-[13px] font-black tracking-[-.5px] text-[#100d0e] sm:h-[70px] sm:px-12 sm:text-[16px]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="shop" className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-271">
          <span className="mb-3 block text-sm font-black tracking-[2px] text-[#c8463e]">
            SHOP BY MEAT
          </span>

          <h2 className="font-impact text-[38px] uppercase leading-none sm:text-[48px]">
            WHAT ARE YOU COOKING?
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#b6a99d]">
            From everyday staples to weekend showstoppers, every category is
            trimmed on request.
          </p>

          <div
            className="
    -mx-6 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-3
    scrollbar-none [&::-webkit-scrollbar]:hidden
    sm:mx-0 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0
    lg:grid-cols-4
  "
          >
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${category.slug}`}
                className="
        group
        w-[calc((100vw-60px)/2)]
        min-w-[calc((100vw-60px)/2)]
        shrink-0
        snap-start
        overflow-hidden
        border border-white/5
        bg-[#2b1e19]
        text-left
        transition
        hover:-translate-y-1
        sm:w-auto
        sm:min-w-0
      "
              >
                <div
                  className="
          relative
          h-36
          bg-[#3a2a24]
          bg-cover
          bg-center
          sm:h-44
        "
                  style={
                    category.image
                      ? { backgroundImage: `url(${category.image})` }
                      : undefined
                  }
                >
                  <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/10" />
                </div>

                <div className="p-3 sm:p-4">
                  <h3 className="font-impact text-[14px] sm:text-[17px]">
                    {category.title}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#b7a89c] sm:text-xs">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}

            <Link
              href="/categories"
              className="
      flex w-[calc((100vw-60px)/2)] min-w-[calc((100vw-60px)/2)] shrink-0
      snap-start
      flex-col
      items-center
      justify-center
      gap-2
      border
      border-white/10
      text-xs
      font-black
      tracking-wider
      text-[#c9beb7]
      transition
      hover:bg-white
      hover:text-black
      sm:hidden
    "
            >
              VIEW ALL <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {(isLoadingProducts || bestSellers.length > 0) && (
        <section className="bg-[#f1e9dc] px-6 py-20 text-[#201614] lg:px-12">
          <div className="mx-auto max-w-271">
            <span className="mb-3 block text-sm font-black tracking-[2px] text-brand">
              BEST SELLERS
            </span>

            <h2 className="font-impact text-[38px] uppercase leading-none sm:text-[48px]">
              BUTCHER&apos;S FAVOURITES
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#665950]">
              Price per kilo. Add to cart and set your cut size at checkout.
            </p>

            <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {isLoadingProducts
                ? Array.from({ length: BEST_SELLER_COUNT }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white">
                      <div className="h-48 bg-[#e6ddd0]" />
                      <div className="space-y-2 p-3">
                        <div className="h-3 w-1/3 bg-[#e6ddd0]" />
                        <div className="h-4 w-3/4 bg-[#e6ddd0]" />
                        <div className="h-3 w-full bg-[#e6ddd0]" />
                        <div className="h-10 w-full bg-[#e6ddd0]" />
                      </div>
                    </div>
                  ))
                : bestSellers.map((product) => (
                    <BestSellerCard
                      key={product.id}
                      product={product}
                      isWishlisted={wishlistIds.has(product.id)}
                    />
                  ))}
            </div>
          </div>
        </section>
      )}

      <section id="how" className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-271">
          <span className="mb-3 block text-sm font-black tracking-[2px] text-[#c8463e]">
            HOW IT WORKS
          </span>

          <h2 className="font-impact text-[38px] uppercase leading-none sm:text-[48px]">
            FROM OUR BLOCK TO YOUR KITCHEN
          </h2>

          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "01",
                "CHOOSE",
                "Browse cuts and tell us your weight, cut and packaging preference.",
              ],
              [
                "02",
                "WE CUT",
                "Your order is cut fresh to the exact size you choose.",
              ],
              [
                "03",
                "WE PACK",
                "Vacuum-sealed or tray-packed, then boxed with ice to hold the cold chain.",
              ],
              [
                "04",
                "YOU COOK",
                "Delivered to your kitchen window. Straight to the freezer, fridge, or fire up the grill.",
              ],
            ].map(([number, title, description]) => (
              <div key={number}>
                <strong className="font-impact text-[42px] leading-none text-brand">
                  {number}
                </strong>

                <h3 className="mt-2 font-impact text-[15px]">{title}</h3>

                <p className="mt-2 max-w-47.5 text-xs leading-relaxed text-[#b6a99d]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="meatbox" className="bg-[#241814] px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-271">
          <span className="mb-3 block text-sm font-black tracking-[2px] text-[#c8463e]">
            MEATBOX
          </span>

          <h2 className="font-impact text-[38px] uppercase leading-none sm:text-[48px]">
            PICK A MEATBOX, SKIP THE DECISIONS
          </h2>

          <p className="mt-2 text-sm text-[#b6a99d]">
            Ready-made boxes for families, grill days and parties.
          </p>

          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            {[
              {
                label: "WEEKLY",
                title: "FAMILY MEATBOX",
                content: "Beef, chicken and mince quantities",
                price: "₦35,000",
                featured: false,
              },
              {
                label: "MOST POPULAR",
                title: "GRILL MASTER MEATBOX",
                content: "Steaks, ribs, sausages and marinades",
                price: "₦48,000",
                featured: true,
              },
              {
                label: "FOR EVENTS",
                title: "PARTY MEATBOX",
                content: "Goat, chicken and beef for 15+ guests",
                price: "₦120,000",
                featured: false,
              },
            ].map((box) => (
              <div
                key={box.title}
                className={`p-6 ${box.featured ? "bg-brand" : "bg-[#1c1310]"}`}
              >
                <span className="text-sm font-bold tracking-[1px] text-[#c8bbb0]">
                  {box.label}
                </span>

                <h3 className="mt-3 font-impact text-[21px] uppercase leading-none">
                  {box.title}
                </h3>

                <p className="mt-3 min-h-[35px] text-xs leading-relaxed text-[#c7b9ae]">
                  [CONTENTS: {box.content}]
                </p>

                <strong className="mt-4 block font-impact text-[18px]">
                  {box.price}
                </strong>

                <button
                  className={`mt-4 w-full border py-3 text-sm font-black ${
                    box.featured
                      ? "border-white text-white hover:bg-white hover:text-brand"
                      : "border-white/60 hover:bg-white hover:text-black"
                  }`}
                >
                  ADD MEATBOX TO CART
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto grid max-w-271 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div
            className="h-[330px] bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=90)",
            }}
          />

          <div>
            <span className="mb-3 block text-sm font-black tracking-[2px] text-[#c8463e]">
              OUR STANDARD
            </span>

            <h2 className="font-impact text-[38px] uppercase leading-[0.92] sm:text-[52px]">
              FRESHNESS ISN&apos;T A PROMISE. IT&apos;S A PROCESS.
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-[#b6a99d]">
              Every cut is traceable, inspected and temperature-controlled from
              the first knife stroke to your doorstep.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <b className="block text-sm">SOURCED WITH CARE</b>
                <span className="text-sm text-[#aa9c91]">
                  Supplier / farm details
                </span>
              </div>

              <div>
                <b className="block text-sm">CUT TO YOUR SPEC</b>
                <span className="text-sm text-[#aa9c91]">
                  Thickness, trim, bone-in or boneless. You decide.
                </span>
              </div>

              <div>
                <b className="block text-sm">COLD CHAIN, ALWAYS</b>
                <span className="text-sm text-[#aa9c91]">
                  Chilled storage, insulated packing and ice for the journey.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="bg-[#f1e9dc] px-6 py-20 text-[#201614] lg:px-12"
      >
        <div className="mx-auto max-w-[1084px]">
          <span className="mb-3 block text-sm font-black tracking-[2px] text-brand">
            QUESTIONS
          </span>

          <h2 className="font-impact text-[38px] uppercase leading-none sm:text-[48px]">
            BEFORE YOU ORDER
          </h2>

          <div className="mt-8 max-w-3xl">
            {faqs.map((faq, index) => (
              <button
                key={faq.question}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="relative block w-full border-t border-[#c8bcae] py-5 pr-10 text-left last:border-b"
              >
                <span className="font-impact text-sm">{faq.question}</span>

                <span className="absolute right-2 top-4 text-sm">
                  {openFaq === index ? "−" : "+"}
                </span>

                {openFaq === index && (
                  <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[#665950]">
                    {faq.answer}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand px-6 py-16 text-center">
        <h2 className="font-impact text-[38px] uppercase leading-none sm:text-[52px]">
          FRESH MEAT. ORDERED IN MINUTES.
        </h2>

        <p className="mt-3 text-xs">
          Get offers, new cuts and seasonal bundles sent straight to your inbox.
        </p>

        <div className="mx-auto mt-5 flex max-w-md flex-col sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your email address"
            className="h-10 flex-1 border border-white/10 px-4 text-xs text-black outline-none"
          />

          <button className="h-10 bg-[#160f0d] px-6 text-sm font-black">
            JOIN THE LIST
          </button>
        </div>

        <button
          onClick={() => scrollTo("shop")}
          className="mt-4 border border-white px-7 py-3 text-sm font-black transition hover:bg-white hover:text-brand"
        >
          START YOUR ORDER
        </button>
      </section>

    </main>
  );
}

export function HomeHero({ crumbs }: { crumbs?: Crumb[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (i: number) => setActive((i + slides.length) % slides.length),
    [],
  );

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => goTo(active + 1), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [active, paused, goTo]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) goTo(active + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  const slide = slides[active];

  return (
    <section
      className="relative isolate flex min-h-[85svh] w-full items-center justify-center overflow-hidden bg-[#241b19] font-worksans lg:min-h-[100svh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute inset-0 -z-10">
        {slides.map((s, i) => (
          <div
            key={i}
            aria-hidden={i !== active}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${s.image})` }}
          />
        ))}
        <div className="absolute inset-0 bg-[#211715]/60" />
        <div className="absolute inset-0 bg-linear-to-t from-[#100d0e]/70 via-transparent to-[#100d0e]/30" />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-20 text-center sm:px-8 lg:py-28">
        <Breadcrumbs crumbs={crumbs} className="mb-6 sm:mb-8" />

        <div
          key={active}
          className="flex animate-[heroFade_.6s_ease] flex-col items-center"
        >
          <h1 className="max-w-4xl font-black uppercase leading-[0.92] tracking-[-1px] text-[#f7f1e9] text-balance text-[clamp(2.25rem,9vw,4rem)] lg:tracking-[-2px] lg:text-[clamp(3.5rem,6vw,6rem)]">
            {slide.lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-5 max-w-xl font-sora text-sm leading-relaxed text-[#e4dbd3] sm:mt-7 sm:text-base">
            {slide.text}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollToId(slide.cta.target)}
            className="bg-brand px-6 py-3.5 text-sm font-black tracking-wide text-white transition hover:bg-[#a91f1b]"
          >
            {slide.cta.label}
          </button>

          <button
            type="button"
            onClick={() => scrollToId("meatbox")}
            className="border border-white/70 px-6 py-3.5 text-sm font-black tracking-wide text-white transition hover:bg-white hover:text-black"
          >
            SEE MEATBOXES
          </button>
        </div>

        <div
          className="mt-10 flex items-center justify-center gap-1"
          role="tablist"
          aria-label="Slides"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className="group flex h-6 w-6 items-center justify-center"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === active
                    ? "h-2 w-6 bg-white"
                    : "h-1.5 w-1.5 bg-white/40 group-hover:bg-white/70"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
