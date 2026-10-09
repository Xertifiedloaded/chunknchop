export function LoadingState() {
  return (
    <div className="py-4">
      <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-[3px] border-neutral-200 border-t-neutral-900" role="status" aria-label="Verifying payment" />

      <h1 className="text-lg font-semibold text-neutral-900">Verifying your payment…</h1>

      <p className="mt-1 text-sm text-neutral-500">Please don&apos;t close this page.</p>
    </div>
  );
}
