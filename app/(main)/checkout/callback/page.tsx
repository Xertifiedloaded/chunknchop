'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import type { VerifyResult } from '@/components/checkout/types';
import { PaymentStatusCard } from '@/components/checkout/PaymentStatusCard';
import { fetchWithAuth } from '@/lib/fetchClient';

function CheckoutCallbackContent() {
  const searchParams = useSearchParams();

  const reference = searchParams.get('reference') || searchParams.get('trxref');

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    if (!reference) {
      setResult({
        status: 'error',
        message: 'No transaction reference found in the URL.',
      });

      setLoading(false);
      return;
    }

    let cancelled = false;

    async function verifyPayment() {
      try {
        setLoading(true);

        const res = await fetchWithAuth(`/api/customer/orders/verify?reference=${encodeURIComponent(reference)}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        const data = await res.json();

        if (cancelled) {
          return;
        }

        if (!res.ok) {
          setResult({
            status: 'error',
            message: data?.message || data?.error || 'Payment verification failed.',
          });

          return;
        }

        setResult(data as VerifyResult);
      } catch (error) {
        console.error('Payment verification error:', error);

        if (!cancelled) {
          setResult({
            status: 'error',
            message: 'Something went wrong while verifying your payment.',
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <PaymentStatusCard loading={loading} result={result} />
    </main>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
          <PaymentStatusCard loading={true} result={null} />
        </main>
      }
    >
      <CheckoutCallbackContent />
    </Suspense>
  );
}
