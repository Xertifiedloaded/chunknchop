import { Suspense } from "react";
import ShopProduct from "./ShopProduct";
import EmptyState from "@/components/sections/shops/EmptyState";
import Hero from "@/components/sections/main/Hero";
import { PageHero } from "@/components/PageHero";

const shopHeroImage =
  "https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=1600&q=90";

export default function ShopPage() {
  return (
    <Suspense fallback={<EmptyState />}>
      <PageHero
        eyebrow="OUR SHOP"
        title="FRESH MEAT. YOUR WAY."
        description="Browse our full selection of fresh cuts, poultry, seafood and more."
        image={shopHeroImage}
        crumbs={[
          { label: "Shop", href: "/shop" },
        ]}
      />
      <ShopProduct />
    </Suspense>
  );
}
