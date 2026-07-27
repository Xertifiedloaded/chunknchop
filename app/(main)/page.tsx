'use client';

import { useState, useEffect } from 'react';
import { useProductStore } from '@/lib/store/productStore';
import Header from '@/components/sections/common/Header';
import Hero from '@/components/sections/main/Hero';
import About from '@/components/sections/main/About';
import WhyUs from '@/components/sections/main/WhyUs';
import Categories from '@/components/sections/main/Categories';
import HowItWorks from '@/components/sections/main/HowItWorks';
import MeatBox from '@/components/sections/main/MeatBox';
import DeliveryCoverage from '@/components/sections/main/DeliveryCoverage';
import Testimonials from '@/components/sections/main/Testimonial';
import MobileAppPromo from '@/components/sections/main/MobileApp';
import Footer from '@/components/sections/common/Footer';
export default function HomePage() {
  const { products, setProducts } = useProductStore();
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Hero />
      <About />
      <WhyUs />
      <Categories />
      <HowItWorks />
      <MeatBox />
      <DeliveryCoverage />
      <Testimonials />
    </div>
  );
}
