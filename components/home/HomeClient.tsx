
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HomeHero from "@/components/sections/HomeHero";
import BestSellerCard from "@/components/sections/BestSellerCard";
import { useProductStore } from "@/store/productStore";
import { useAuthStore } from "@/store/authStore";
import { fetchWithAuth } from "@/lib/http/fetchClient";
import type { HomeContent } from "@/lib/cms/home";

const BEST_SELLER_COUNT = 4;
const formatPrice = (n: number) => `₦${n.toLocaleString("en-NG")}`;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function HomeClient({ content }: { content: HomeContent }) {
  const { banner, slides, highlights, categories, sections, steps, meatboxes, standardPoints, faqs } = content;

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const products = useProductStore((s) => s.products);
  const setProducts = useProductStore((s) => s.setProducts);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isHydrated || !user || user.role === "SUPPLIER" || user.role === "STAFF") {
      setWishlistIds(new Set());
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetchWithAuth("/api/customer/wishlist", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const list = data.wishlist ?? data.items ?? data.products ?? [];
        if (!cancelled) {
          setWishlistIds(new Set(list.map((i: any) => i.productId ?? i.product?.id ?? i.id)));
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
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        if (!cancelled) setProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
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

  const { shop, bestsellers, how, meatbox, standard, faq, newsletter } = sections;

  return (
    <main className="min-h-screen bg-[#17110f] text-[#f8f3eb]">
      {banner && (
        <div className="bg-brand px-4 py-2 text-center text-xs font-black tracking-wide text-white">
          {banner.link ? (
            <Link href={banner.link} className="hover:underline">
              {banner.text}
            </Link>
          ) : (
            banner.text
          )}
        </div>
      )}

      <HomeHero slides={slides} />

      {highlights.length > 0 && (
        <section className="overflow-hidden bg-ink">
          <div className="marquee-track flex w-max">
            {[...highlights, ...highlights].map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex h-14.5 shrink-0 items-center justify-center border-b border-[#100d0e]/10 px-8 text-center text-[13px] font-black tracking-[-.5px] whitespace-nowrap text-[#100d0e] sm:h-[70px] sm:px-12 sm:text-[16px]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="shop" className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-271">
          {shop.eyebrow && <span className="mb-3 block text-sm font-black tracking-[2px] text-[#c8463e]">{shop.eyebrow}</span>}

          <h2 className="font-impact text-[38px] leading-none uppercase sm:text-[48px]">{shop.heading}</h2>

          {shop.subtext && <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#b6a99d]">{shop.subtext}</p>}

          <div className="-mx-6 mt-8 flex snap-x snap-mandatory scrollbar-none gap-3 overflow-x-auto px-6 pb-3 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${category.slug}`}
                className="group w-[calc((100vw-60px)/2)] min-w-[calc((100vw-60px)/2)] shrink-0 snap-start overflow-hidden border border-white/5 bg-[#2b1e19] text-left transition hover:-translate-y-1 sm:w-auto sm:min-w-0"
              >
                <div className="relative h-36 bg-[#3a2a24] bg-cover bg-center sm:h-44" style={category.image ? { backgroundImage: `url(${category.image})` } : undefined}>
                  <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/10" />
                </div>

                <div className="p-3 sm:p-4">
                  <h3 className="font-impact text-[14px] sm:text-[17px]">{category.name}</h3>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#b7a89c] sm:text-xs">{category.description}</p>
                </div>
              </Link>
            ))}

            <Link
              href="/categories"
              className="flex w-[calc((100vw-60px)/2)] min-w-[calc((100vw-60px)/2)] shrink-0 snap-start flex-col items-center justify-center gap-2 border border-white/10 text-xs font-black tracking-wider text-[#c9beb7] transition hover:bg-white hover:text-black sm:hidden"
            >
              {shop.buttonLabel ?? "VIEW ALL"} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {(isLoadingProducts || bestSellers.length > 0) && (
        <section className="bg-[#f1e9dc] px-6 py-20 text-[#201614] lg:px-12">
          <div className="mx-auto max-w-271">
            {bestsellers.eyebrow && <span className="mb-3 block text-sm font-black tracking-[2px] text-brand">{bestsellers.eyebrow}</span>}

            <h2 className="font-impact text-[38px] leading-none uppercase sm:text-[48px]">{bestsellers.heading}</h2>

            {bestsellers.subtext && <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#665950]">{bestsellers.subtext}</p>}

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
                : bestSellers.map((product) => <BestSellerCard key={product.id} product={product} isWishlisted={wishlistIds.has(product.id)} />)}
            </div>
          </div>
        </section>
      )}

      {steps.length > 0 && (
        <section id="how" className="px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-271">
            {how.eyebrow && <span className="mb-3 block text-sm font-black tracking-[2px] text-[#c8463e]">{how.eyebrow}</span>}

            <h2 className="font-impact text-[38px] leading-none uppercase sm:text-[48px]">{how.heading}</h2>

            <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <div key={`${step.number}-${step.title}`}>
                  <strong className="font-impact text-[42px] leading-none text-brand">{step.number}</strong>
                  <h3 className="mt-2 font-impact text-[15px]">{step.title}</h3>
                  <p className="mt-2 max-w-47.5 text-xs leading-relaxed text-[#b6a99d]">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {meatboxes.length > 0 && (
        <section id="meatbox" className="bg-[#241814] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-271">
            {meatbox.eyebrow && <span className="mb-3 block text-sm font-black tracking-[2px] text-[#c8463e]">{meatbox.eyebrow}</span>}

            <h2 className="font-impact text-[38px] leading-none uppercase sm:text-[48px]">{meatbox.heading}</h2>

            {meatbox.subtext && <p className="mt-2 text-sm text-[#b6a99d]">{meatbox.subtext}</p>}

            <div className="mt-8 grid gap-3 lg:grid-cols-3">
              {meatboxes.map((box) => (
                <div key={box.id} className={`p-6 ${box.featured ? "bg-brand" : "bg-[#1c1310]"}`}>
                  <span className="text-sm font-bold tracking-[1px] text-[#c8bbb0]">{box.label}</span>

                  <h3 className="mt-3 font-impact text-[21px] leading-none uppercase">{box.title}</h3>

                  <p className="mt-3 min-h-[35px] text-xs leading-relaxed text-[#c7b9ae]">{box.contents}</p>

                  <strong className="mt-4 block font-impact text-[18px]">{formatPrice(box.price)}</strong>

                  <Link
                    href={box.link ?? "/shop?category=meatbox"}
                    className={`mt-4 block w-full border py-3 text-center text-sm font-black transition ${
                      box.featured ? "border-white text-white hover:bg-white hover:text-brand" : "border-white/60 hover:bg-white hover:text-black"
                    }`}
                  >
                    {meatbox.buttonLabel ?? "ADD MEATBOX TO CART"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto grid max-w-271 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          {standard.image && <div className="h-[330px] bg-cover bg-center" style={{ backgroundImage: `url(${standard.image})` }} />}

          <div>
            {standard.eyebrow && <span className="mb-3 block text-sm font-black tracking-[2px] text-[#c8463e]">{standard.eyebrow}</span>}

            <h2 className="font-impact text-[38px] leading-[0.92] uppercase sm:text-[52px]">{standard.heading}</h2>

            {standard.subtext && <p className="mt-4 text-sm leading-relaxed text-[#b6a99d]">{standard.subtext}</p>}

            <div className="mt-6 space-y-5">
              {standardPoints.map((point) => (
                <div key={point.title}>
                  <b className="block text-sm">{point.title}</b>
                  <span className="text-sm text-[#aa9c91]">{point.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section id="faq" className="bg-[#f1e9dc] px-6 py-20 text-[#201614] lg:px-12">
          <div className="mx-auto max-w-[1084px]">
            {faq.eyebrow && <span className="mb-3 block text-sm font-black tracking-[2px] text-brand">{faq.eyebrow}</span>}

            <h2 className="font-impact text-[38px] leading-none uppercase sm:text-[48px]">{faq.heading}</h2>

            <div className="mt-8 max-w-3xl">
              {faqs.map((item, index) => (
                <button
                  key={`${item.question}-${index}`}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  aria-expanded={openFaq === index}
                  className="relative block w-full border-t border-[#c8bcae] py-5 pr-10 text-left last:border-b"
                >
                  <span className="font-impact text-sm">{item.question}</span>
                  <span className="absolute top-4 right-2 text-sm">{openFaq === index ? "−" : "+"}</span>
                  {openFaq === index && <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[#665950]">{item.answer}</p>}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-brand px-6 py-16 text-center">
        <h2 className="font-impact text-[38px] leading-none uppercase sm:text-[52px]">{newsletter.heading}</h2>

        {newsletter.subtext && <p className="mt-3 text-xs">{newsletter.subtext}</p>}

        <div className="mx-auto mt-5 flex max-w-md flex-col sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your email address"
            className="h-10 flex-1 border border-white/10 px-4 text-xs text-black outline-none"
          />


          <button type="button" className="h-10 bg-[#160f0d] px-6 text-sm font-black">
            {newsletter.buttonLabel ?? "JOIN THE LIST"}
          </button>
        </div>

        <button onClick={() => scrollToId("shop")} className="mt-4 border border-white px-7 py-3 text-sm font-black transition hover:bg-white hover:text-brand">
          {newsletter.secondaryLabel ?? "START YOUR ORDER"}
        </button>
      </section>
    </main>
  );
}