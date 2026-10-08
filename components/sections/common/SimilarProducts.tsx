'use client';

import Image from 'next/image';

interface SimilarProductsItem {
  id: string;
  name: string;
  images: string[];
}

interface SimilarProductsProps {
  eyebrow: string;
  heading: string;
  items: SimilarProductsItem[];
}

export default function SimilarProducts({ eyebrow, heading, items }: SimilarProductsProps) {
  return (
    <section className="mt-20">
      <div className="mb-4">
        <p className="text-brand text-xs font-semibold tracking-widest uppercase">{eyebrow}</p>
        <h2 className="font-sora text-charcoal mt-2 text-3xl font-bold">{heading}</h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="group relative h-72 overflow-hidden rounded-3xl">
            <Image src={item.images?.[0] || '/placeholder.png'} alt={item.name} fill className="object-cover transition duration-500 group-hover:scale-105" />

            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

            <div className="absolute bottom-5 left-5">
              <h3 className="text-md font-sora font-semibold text-white">{item.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
