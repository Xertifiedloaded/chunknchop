'use client';

import { useRouter } from 'next/navigation';
import { DetailRow } from './DetailRow';
import type { VerifySuccess } from './types';

export function SuccessState({ result }: { result: VerifySuccess }) {
  const router = useRouter();

  return (
    <div>
      {/* Success icon */}
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
        <span className="text-2xl font-bold text-green-600">✓</span>
      </div>

      <h1 className="text-xl font-semibold text-neutral-900">Payment successful</h1>

      <p className="mt-2 text-sm text-neutral-500">
        ₦
        {result.total.toLocaleString('en-NG', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{' '}
        received.
      </p>

      <div className="mt-6 rounded-lg bg-neutral-50 px-4 py-2 text-left">
        <DetailRow label="Reference" value={result.reference} />

        <DetailRow label="Order ID" value={result.orderId} />

        {result.paidAt && <DetailRow label="Paid at" value={new Date(result.paidAt).toLocaleString()} />}

        {result.channel && <DetailRow label="Channel" value={result.channel} />}
      </div>

      <button type="button" onClick={() => router.push(`/orders/${result.orderId}`)} className="mt-6 w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
        View order
      </button>
    </div>
  );
}
