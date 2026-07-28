import prisma from '@/lib/db';

import Header from '@/components/sections/common/Header';
import Hero from '@/components/sections/main/Hero';
import About from '@/components/sections/main/About';
import WhyUs from '@/components/sections/main/WhyUs';
import Categories from '@/components/sections/main/Categories';
import HowItWorks from '@/components/sections/main/HowItWorks';
import MeatBox from '@/components/sections/main/MeatBox';
import DeliveryCoverage from '@/components/sections/main/DeliveryCoverage';
import MobileAppPromo from '@/components/sections/main/MobileApp';
import Footer from '@/components/sections/common/Footer';
import Reviews, { ReviewsSkeleton } from '@/components/sections/main/Reviews';

export default async function HomePage() {
  let reviews = null;

  try {
    reviews = await prisma.rating.findMany({
      where: {
        comment: {
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
      include: {
        user: true,
        product: true,
      },
    });
  } catch (error) {
    console.error('Failed to load reviews:', error);
  }

  return (
    <div className="min-h-screen">
      <Hero
        title={<>Premium Quality Meat, <span className="text-brand">Delivered Fresh</span> Across Lagos.</>}
        paragraph="Certified, hygienically processed livestock products expertly portioned, carefully packaged, and delivered to your doorstep or picked up at a ChunkNChop counter near you."
        isCenter={false}
        features={true}
      />
      <About />
      <WhyUs />
      <Categories />
      <HowItWorks />
      <MeatBox />
      <DeliveryCoverage />
      {reviews === null ? (
        <ReviewsSkeleton />
      ) : (
        <Reviews reviews={reviews} />
      )}
      <MobileAppPromo />
    </div>
  );
}



