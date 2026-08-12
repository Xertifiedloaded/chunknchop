import { ROLE_META, StaffRole } from '@/lib/permission';

const COLOR_CLASSES: Record<string, string> = {
  violet: 'bg-violet-500/10 text-violet-300 ring-violet-500/30',
  blue: 'bg-blue-500/10 text-blue-300 ring-blue-500/30',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  sky: 'bg-sky-500/10 text-sky-300 ring-sky-500/30',
  rose: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
  stone: 'bg-stone-500/10 text-stone-300 ring-stone-500/30',
};

interface RoleBadgeProps {
  staffRole: StaffRole;
  showDepartment?: boolean;
  className?: string;
}

export function RoleBadge({ staffRole, showDepartment = true, className = '' }: RoleBadgeProps) {
  const meta = ROLE_META[staffRole];
  const colorClass = COLOR_CLASSES[meta.color] ?? COLOR_CLASSES.stone;

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colorClass}`}>{meta.label}</span>
      {showDepartment && <span className="text-xs text-stone-500">{meta.department}</span>}
    </div>
  );
}
