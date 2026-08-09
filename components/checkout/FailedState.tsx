'use client';

import { useRouter } from 'next/navigation';
import type { VerifyFailed } from './types';

export function FailedState({ result }: { result: VerifyFailed }) {
  const router = useRouter();

  return (
    <div>
      {/* Failed icon */}
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <span className="text-2xl font-bold text-red-600">✕</span>
      </div>

      <h1 className="text-xl font-semibold text-neutral-900">Payment failed</h1>

      <p className="mt-2 text-sm leading-6 text-neutral-500">{result.message}</p>

      {result.reference && (
        <div className="mt-4 rounded-lg bg-neutral-50 px-4 py-3 text-left">
          <DetailRow label="Reference" value={result.reference} />
        </div>
      )}

      <button type="button" onClick={() => router.push('/checkout')} className="mt-6 w-full rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
        Try again
      </button>
    </div>
  );
}
