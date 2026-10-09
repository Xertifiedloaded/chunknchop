import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categories } from "@/lib";
import { HomeHero } from "../page";
import { PageHero } from "@/components/PageHero";

export default function CategoriesPage() {
  return (
    <>
      <PageHero
        eyebrow="EXPLORE OUR RANGE"
        title="SHOP BY CATEGORY"
        description="Explore fresh meat, poultry, seafood, sausages, dairy, spices and more."
        image="https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1600&q=90"
        crumbs={[{ label: "Categories", href: "/categories" }]}
      />
      <main className="min-h-screen bg-[#100d0e] text-white">
        <section className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-black tracking-[0.2em] text-[#b7a89c] uppercase">Shop by category</p>

            <h1 className="mt-3 font-impact text-4xl tracking-tight uppercase sm:text-5xl lg:text-6xl">Everything we sell</h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#b7a89c] sm:text-base">Browse our full selection of fresh meat, poultry, seafood, sausages, dairy, spices, and more.</p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${category.slug}`}
                className="group overflow-hidden border border-white/10 bg-[#2b1e19] transition duration-300 hover:-translate-y-1 hover:border-white/20"
              >
                <div
                  className="relative h-40 bg-[#3a2a24] bg-cover bg-center sm:h-52 lg:h-56"
                  style={
                    category.image
                      ? {
                          backgroundImage: `url(${category.image})`,
                        }
                      : undefined
                  }
                >
                  {!category.image && <div className="flex h-full items-center justify-center text-xs font-bold tracking-widest text-[#8f8178] uppercase">No image</div>}

                  <div className="absolute inset-0 bg-black/30 transition group-hover:bg-black/10" />

                  <div className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center bg-white text-black opacity-0 transition group-hover:opacity-100">
                    <ArrowRight size={15} />
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <h2 className="font-impact text-[15px] uppercase sm:text-lg">{category.title}</h2>

                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#b7a89c] sm:text-sm">{category.description}</p>

                  <div className="mt-4 text-[10px] font-black tracking-[0.15em] text-[#d8cec7] uppercase">Shop category →</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
