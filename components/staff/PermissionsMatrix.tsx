import { PERMISSION_AREAS, ROLE_META, ROLE_PERMISSIONS, STAFF_ROLES } from '@/lib/permission';
import { PermissionCell } from './PermissionCell';

PERMISSION_AREAS;
export function PermissionsMatrix() {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-800">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-stone-800 bg-stone-900/60">
            <th className="sticky left-0 bg-stone-900/60 px-4 py-3 text-xs font-medium tracking-wide text-stone-500 uppercase">Area</th>
            {STAFF_ROLES.map((role) => (
              <th key={role} className="px-4 py-3 text-xs font-medium tracking-wide text-stone-500 uppercase">
                {ROLE_META[role].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_AREAS.map((area, idx) => (
            <tr key={area} className={idx % 2 === 0 ? 'bg-transparent' : 'bg-stone-900/30'}>
              <td className="sticky left-0 bg-inherit px-4 py-3 text-sm font-medium whitespace-nowrap text-stone-200">{area}</td>
              {STAFF_ROLES.map((role) => (
                <td key={role} className="px-4 py-3">
                  <PermissionCell level={ROLE_PERMISSIONS[role][area]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
