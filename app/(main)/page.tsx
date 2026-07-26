'use client';

import { useState, useEffect } from 'react';
import { useProductStore } from '@/lib/store/productStore';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import WhyUs from '@/components/WhyUs';
import Categories from '@/components/Categories';
import HowItWorks from '@/components/HowItWorks';
import MeatBox from '@/components/MeatBox';
import DeliveryCoverage from '@/components/DeliveryCoverage';
import Testimonials from '@/components/Testimonial';
import MobileAppPromo from '@/components/MobileApp';
import Footer from '@/components/Footer';
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
