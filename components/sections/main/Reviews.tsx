'use client';

import { Star } from 'lucide-react';

interface Review {
  id: string;
  score: number;
  title: string | null;
  comment: string | null;
  user: {
    name: string | null;
  };
  product: {
    name: string;
  };
}

interface TestimonialsProps {
  reviews: Review[];
}

export default function Reviews({ reviews }: TestimonialsProps) {
  return (
    <section className="bg-sand py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5">
        <div className="">
          <p className="text-brand font-worksans text-xs font-bold tracking-wide uppercase">Loved by our customers ❤️</p>

          <h2 className="font-sora mt-2 text-2xl font-bold text-black sm:text-3xl">
            What our <span className="text-brand">customers</span> are saying.
          </h2>
        </div>

        <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
          {reviews.map((review) => {
            const customerName = review.user.name || 'Customer';
            const initial = customerName.charAt(0).toUpperCase();

            return (
              <div key={review.id} className="w-[82%] shrink-0 snap-start rounded-2xl bg-white p-5 text-left shadow-sm sm:w-auto sm:p-7">
                <div className="text-brand flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={16} fill={index < review.score ? 'currentColor' : 'none'} />
                  ))}
                </div>

                {review.title && <h3 className="mt-3 text-sm font-bold text-black capitalize">{review.title}</h3>}

                {review.comment && <p className="text-charcoal/70 mt-3 text-xs leading-relaxed sm:text-[15px]">&quot;{review.comment}&quot;</p>}

                <div className="mt-5 flex items-center gap-3 sm:mt-6">
                  <div className="bg-brand/10 text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">{initial}</div>

                  <div>
                    <p className="text-sm font-bold text-black capitalize">{customerName}</p>

                    <p className="text-ink text-xs capitalize">Reviewed {review.product.name}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ReviewsSkeleton() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />

              <div className="mt-4 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
              </div>

              <div className="mt-6 h-4 w-32 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
