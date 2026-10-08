import { LoadingState } from './LoadingState';
import { SuccessState } from './SuccessState';
import { FailedState } from './FailedState';
import { ErrorState } from './ErrorState';
import type { VerifyResult } from './types';

export function PaymentStatusCard({ loading, result }: { loading: boolean; result: VerifyResult | null }) {
  return (
    <div className="w-full max-w-md rounded-xl border border-neutral-100 bg-white p-8 text-center shadow-sm">
      {loading && <LoadingState />}

      {!loading && result?.status === 'success' && <SuccessState result={result} />}

      {!loading && result?.status === 'failed' && <FailedState result={result} />}

      {!loading && result?.status === 'error' && <ErrorState result={result} />}

      {!loading && !result && (
        <ErrorState
          result={{
            status: 'error',
            message: 'Unable to determine payment status.',
          }}
        />
      )}
    </div>
  );
}
