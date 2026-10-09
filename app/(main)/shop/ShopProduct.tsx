"use client";

import { useMemo } from "react";

import ProductSection from "@/features/catalog/components/ProductSection";
import Shop from "@/components/sections/shops/Shop";
import { useProductStore } from "@/store/productStore";
import MeatBox from "@/components/sections/MeatBox";
import MobileAppPromo from "@/components/sections/MobileApp";
import WhyBuyFromChunkNChop from "@/components/sections/WhyBuyFromChunkNChop";

export default function ShopProduct() {
  const { products } = useProductStore();

  const bestSellerProducts = useMemo(() => {
    return products.filter((product) => product.isBestSeller);
  }, [products]);

  const newArrivalProducts = useMemo(() => {
    return products.filter((product) => product.isNewArrival);
  }, [products]);

  return (
    <main>
      <Shop />

      <div className="">
        <ProductSection title="Best Sellers" description="Our most popular cuts" products={bestSellerProducts} viewAllHref="/shop?section=best-sellers" />
        <MeatBox />
        <div className="bg-sand">
          <ProductSection title="New Arrivals" description="Fresh products just added" products={newArrivalProducts} viewAllHref="/shop?section=new-arrivals" />
        </div>
        <MobileAppPromo />
        <WhyBuyFromChunkNChop />
      </div>
    </main>
  );
}
