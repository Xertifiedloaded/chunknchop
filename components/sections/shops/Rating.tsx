'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Star, BadgeCheck, Loader2, X } from 'lucide-react';

interface RatingUser {
  id: string;
  name: string | null;
  email: string;
}

interface RatingItem {
  id: string;
  score: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  user: RatingUser;
}

interface ReviewsSectionProps {
  productId: string;
  initialRating?: number;
  initialReviewCount?: number;
}

const fetcher = async (url: string): Promise<RatingItem[]> => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error('Failed to load reviews');
  }

  return res.json();
};

function StarRow({ count = 5, size = 'w-4 h-4' }: { count?: number; size?: string }) {
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${size} ${i < Math.round(count) ? 'fill-orange-500 text-orange-500' : 'fill-gray-200 text-gray-200'}`} />
      ))}
    </div>
  );
}

function initialsFromName(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;

  const weeks = Math.floor(days / 7);

  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;

  const months = Math.floor(days / 30);

  if (months <= 1) return '1 month ago';

  return `${months} months ago`;
}

export default function ReviewsSection({ productId, initialRating = 0, initialReviewCount = 0 }: ReviewsSectionProps) {
  const {
    data: ratings = [],
    error,
    isLoading,
    mutate,
  } = useSWR<RatingItem[]>(productId ? `/api/products/${productId}/ratings` : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 10000,
  });

  const [showForm, setShowForm] = useState(false);
  const [score, setScore] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/products/${productId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score,
          title: title.trim() || null,
          comment: comment.trim() || null,
        }),
      });

      if (res.status === 401) {
        setSubmitError('Sign in to write a review.');
        return;
      }

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(body?.error || 'Failed to submit review');
      }

      setShowForm(false);
      setTitle('');
      setComment('');
      setScore(5);
      await mutate();
    } catch (err) {
      console.error('Failed to submit review:', err);

      setSubmitError(err instanceof Error ? err.message : 'Something went wrong submitting your review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewCount = ratings.length > 0 ? ratings.length : initialReviewCount;

  const average = ratings.length > 0 ? ratings.reduce((acc, rating) => acc + rating.score, 0) / ratings.length : initialRating;

  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = ratings.filter((rating) => rating.score === stars).length;

    const pct = ratings.length > 0 ? (count / ratings.length) * 100 : 0;

    return {
      stars,
      pct,
    };
  });

  return (
    <section className="w-full">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-orange-500 uppercase">Reviews</p>

          <h2 className="font-sora text-2xl font-bold text-gray-900 sm:text-3xl">What our customers say</h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((current) => !current);
            setSubmitError(null);
          }}
          className="w-fit rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:border-gray-400 hover:bg-gray-50"
        >
          {showForm ? 'Cancel' : 'Write a review'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Your review</p>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSubmitError(null);
              }}
              className="text-gray-400 transition hover:text-gray-600"
              aria-label="Close form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4">
            <p className="mb-1.5 text-xs font-medium text-gray-500">Rating</p>

            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setScore(n)} aria-label={`${n} stars`} className="rounded-sm transition hover:scale-110">
                  <Star className={`h-6 w-6 ${n <= score ? 'fill-orange-500 text-orange-500' : 'fill-gray-200 text-gray-200'}`} />
                </button>
              ))}
            </div>
          </div>

          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Great quality)" className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 focus:border-gray-400" />

          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell others about your experience" rows={3} className="mb-3 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 focus:border-gray-400" />

          {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}

          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}

            {isSubmitting ? 'Submitting...' : 'Submit review'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-red-600">Could not load reviews right now.</p>

          <button type="button" onClick={() => mutate()} className="mt-3 text-sm font-semibold text-gray-900 underline">
            Try again
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full shrink-0 rounded-2xl border border-gray-200 bg-white p-6 lg:w-80">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-gray-900">{average.toFixed(1)}</span>

              <span className="text-lg text-gray-400">/ 5</span>
            </div>

            <div className="mt-2">
              <StarRow count={Math.round(average)} size="w-5 h-5" />
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Based on {reviewCount} verified review
              {reviewCount === 1 ? '' : 's'}
            </p>

            <div className="mt-6 space-y-2.5">
              {breakdown.map((row) => (
                <div key={row.stars} className="flex items-center gap-2 text-sm">
                  <span className="flex w-10 items-center gap-1 text-gray-600">
                    {row.stars}

                    <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                  </span>

                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-orange-500 transition-all"
                      style={{
                        width: `${row.pct}%`,
                      }}
                    />
                  </div>

                  <span className="w-10 text-right text-gray-500">{row.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {ratings.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <p className="text-sm font-semibold text-gray-900">No reviews yet</p>

              <p className="mt-1 text-sm text-gray-500">Be the first to share what you thought of this product.</p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-4">
              {ratings.map((review) => (
                <div key={review.id} className="rounded-2xl border border-gray-200 p-5 transition hover:border-gray-300">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">{initialsFromName(review.user.name, review.user.email)}</div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="max-w-full truncate text-xs font-semibold text-gray-900 sm:text-sm">{review.user.name || review.user.email.split('@')[0]}</span>

                        <span className="bg-lemon-nigeria text-nigeria inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium sm:text-[10px]">
                          <BadgeCheck className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                          Verified buyer
                        </span>
                      </div>

                      <p className="mt-0.5 text-[10px] text-gray-400 sm:text-xs">{timeAgo(review.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mb-1.5 flex items-center gap-2">
                    <StarRow count={review.score} />

                    {review.title && <span className="text-sm font-semibold text-gray-900">{review.title}</span>}
                  </div>

                  {review.comment && <p className="text-sm leading-relaxed text-gray-600">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
