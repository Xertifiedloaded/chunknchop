import { PermissionLevel } from '@/lib/permission';

const LEVEL_STYLES: Record<PermissionLevel, string> = {
  Full: 'text-emerald-300',
  Edit: 'text-blue-300',
  Approve: 'text-amber-300',
  View: 'text-stone-300',
  Request: 'text-amber-300/80',
  None: 'text-stone-600',
};

const LEVEL_DOT: Record<PermissionLevel, string> = {
  Full: 'bg-emerald-400',
  Edit: 'bg-blue-400',
  Approve: 'bg-amber-400',
  View: 'bg-stone-400',
  Request: 'bg-amber-400/70',
  None: 'bg-stone-700',
};

export function PermissionCell({ level }: { level: PermissionLevel }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${LEVEL_DOT[level]}`} />
      <span className={`text-sm ${LEVEL_STYLES[level]}`}>{level}</span>
    </div>
  );
}
