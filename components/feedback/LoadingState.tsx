export default function LoadingState() {
  return (
    <div className="flex min-h-75 flex-col items-center justify-center bg-white px-6">
      <div className="flex flex-col items-center">
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-brand/15 border-t-brand" />

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-brand"
              aria-hidden="true"
            >
              <path d="M3 7h18l-2 13H5L3 7Z" />
              <path d="m7 7 5-5 5 5" />
              <path d="M9 11v5m6-5v5" />
            </svg>
          </div>
        </div>

        <p className="text-base font-bold tracking-tight text-gray-900">
          Chunk<span className="text-brand">N</span>Chop
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Getting the best products for you
        </p>

        <div className="mt-5 flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand" />
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          Loading products. Please wait.
        </span>
      </div>
    </div>
  );
}