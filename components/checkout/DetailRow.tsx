export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 py-2 text-sm last:border-b-0">
      <span className="text-neutral-500">{label}</span>

      <span className="text-right font-medium text-neutral-900">{value}</span>
    </div>
  );
}
