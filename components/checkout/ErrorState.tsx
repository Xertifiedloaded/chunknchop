'use client';

import Link from 'next/link';
import type { VerifyError } from './types';

export function ErrorState({ result }: { result: VerifyError }) {
  return (
    <div>
      {/* Error icon */}
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <span className="text-2xl font-bold text-amber-600">!</span>
      </div>

      <h1 className="text-xl font-semibold text-neutral-900">Couldn&apos;t verify payment</h1>

      <p className="mt-2 text-sm leading-6 text-neutral-500">{result.message}</p>

      <Link href="/checkout" className="mt-6 inline-block text-sm font-medium text-neutral-900 underline underline-offset-2">
        Back to checkout
      </Link>
    </div>
  );
}
