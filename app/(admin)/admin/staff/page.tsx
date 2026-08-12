'use client';

import { useState } from 'react';
import { Activity, Clock3, ShieldCheck, TrendingUp, UserPlus, UsersRound } from 'lucide-react';
import useSWR from 'swr';

type Tab = 'Employees' | 'Roles' | 'Permissions' | 'Activity Logs' | 'Attendance' | 'Performance';

const tabs: Tab[] = ['Employees', 'Roles', 'Permissions', 'Activity Logs', 'Attendance', 'Performance'];

const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }

  return response.json();
};

function getArray(data: any, keys: string[] = []) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

function useStaffList() {
  const { data, error } = useSWR('/api/admin/staff', fetcher);

  const staff = getArray(data, ['staff', 'employees', 'users']);

  return {
    staff,
    isLoading: !error && !data,
    isError: !!error,
  };
}

function usePermissionsList() {
  const { data, error } = useSWR('/api/admin/permissions', fetcher);

  const permissions = getArray(data, ['permissions', 'data']);

  return {
    permissions,
    isLoading: !error && !data,
    isError: !!error,
  };
}

function StatCard({ label, value, description, icon, iconClass, accent }: { label: string; value: string; description: string; icon: React.ReactNode; iconClass: string; accent?: boolean }) {
  return (
    <div className={`relative min-h-26 rounded-[15px] border border-[#ebe8e5] bg-white px-4 py-3.5 shadow-[0_2px_7px_rgba(35,27,22,0.04)] ${accent ? 'overflow-hidden' : ''}`}>
      {accent && <div className="absolute inset-x-0 top-0 h-[3px] bg-[#f15a24]" />}

      <div className="flex items-start justify-between">
        <p className="text-[10px] font-normal text-[#817a74]">{label}</p>

        <div className={`flex h-7 w-7 items-center justify-center rounded-[9px] ${iconClass}`}>{icon}</div>
      </div>

      <p className="mt-1.5 text-[21px] font-bold tracking-[-0.4px] text-[#292522]">{value}</p>

      <p className="mt-1 text-[9px] text-[#948d87]">{description}</p>
    </div>
  );
}

function PermissionBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    Full: 'bg-[#e4f8ef] text-[#13895c]',
    View: 'bg-[#fff5dd] text-[#bc7610]',
    Edit: 'bg-[#fff5dd] text-[#bc7610]',
    Approve: 'bg-[#fff5dd] text-[#bc7610]',
    Request: 'bg-[#fff5dd] text-[#bc7610]',
    None: 'bg-[#e9e7e5] text-[#615b56]',
  };

  return <span className={`inline-flex min-w-[30px] items-center justify-center rounded-full px-2 py-[3px] text-[8px] font-semibold ${styles[value] || 'bg-[#e9e7e5] text-[#615b56]'}`}>{value}</span>;
}

export default function StaffManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('Employees');

  const { staff, isLoading: staffLoading } = useStaffList();
  const { permissions: apiPermissions, isLoading: permissionsLoading } = usePermissionsList();

  const uniqueRoleCount = new Set(staff.map((employee: any) => employee.staffRole).filter(Boolean)).size;

  const totalPermissions = apiPermissions.length;

  const tabCounts: Partial<Record<Tab, number>> = {
    Employees: staff.length,
    Roles: uniqueRoleCount,
    Permissions: totalPermissions,
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-3 py-5 text-[#302c29] sm:px-5 lg:px-[22px]">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.4px] text-[#292522] sm:text-[22px]">Staff Management</h1>

            <p className="mt-1 text-[10px] text-[#918a84] sm:text-[11px]">Butchers, riders, support and admin — with roles, permissions, attendance and audit trail.</p>
          </div>

          <button className="flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-[#f15a24] px-3.5 text-[11px] font-medium text-white transition hover:bg-[#df4e1b]">
            <UserPlus size={14} strokeWidth={2} />

            <span className="hidden sm:inline">Invite Employee</span>

            <span className="sm:hidden">Invite</span>
          </button>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Employees" value={staffLoading ? '...' : String(staff.length)} description="From staff API" icon={<UsersRound size={15} />} iconClass="bg-[#fff0ea] text-[#ef5a25]" accent />

          <StatCard label="On Shift Now" value={staffLoading ? '...' : String(staff.length)} description="Currently working" icon={<Clock3 size={15} />} iconClass="bg-[#eafaf4] text-[#00a56a]" />

          <StatCard label="Roles Defined" value={staffLoading ? '...' : String(uniqueRoleCount)} description="Unique staff roles" icon={<ShieldCheck size={15} />} iconClass="bg-[#fceef1] text-[#8b3042]" />

          <StatCard label="Avg Accuracy" value={staffLoading ? '...' : String(staff.length)} description="Weight and prep spec" icon={<Activity size={15} />} iconClass="bg-[#ebe9e7] text-[#625c57]" />
        </section>

        <section className="mt-4 overflow-hidden rounded-[15px] border border-[#e8e5e2] bg-white shadow-[0_2px_7px_rgba(35,27,22,0.04)]">
          <div className="overflow-x-auto border-b border-[#ebe8e5]">
            <nav className="flex min-w-max items-center gap-1 px-3 py-2">
              {tabs.map((tab) => {
                const active = activeTab === tab;
                const count = tabCounts[tab];

                const loading = (tab === 'Employees' && staffLoading) || (tab === 'Roles' && staffLoading) || (tab === 'Permissions' && permissionsLoading);

                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[10px] font-medium transition ${active ? 'bg-[#292522] text-white' : 'text-[#4f4944] hover:bg-[#f5f3f1]'}`}>
                    {tab}

                    {count !== undefined && <span className={`rounded-full px-1.5 py-0.5 text-[8px] ${active ? 'bg-[#5b5753] text-white' : 'bg-[#e7e5e3] text-[#706a65]'}`}>{loading ? '...' : count}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {activeTab === 'Employees' && <EmployeesTab />}

          {activeTab === 'Roles' && <RolesTab />}

          {activeTab === 'Permissions' && <PermissionsTab permissions={apiPermissions} isLoading={permissionsLoading} />}

          {activeTab === 'Activity Logs' && <EmptyTab icon={<Activity size={18} />} title="Activity Logs" description="Staff activity and audit events will appear here." />}

          {activeTab === 'Attendance' && <EmptyTab icon={<Clock3 size={18} />} title="Attendance" description="Staff attendance and shift records will appear here." />}

          {activeTab === 'Performance' && <EmptyTab icon={<TrendingUp size={18} />} title="Performance" description="Staff performance metrics will appear here." />}
        </section>
      </div>
    </main>
  );
}

function EmployeesTab() {
  const { staff, isLoading, isError } = useStaffList();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] border-collapse">
        <thead>
          <tr className="bg-[#faf9f8]">
            <th className="px-3.5 py-2.5 text-left text-[8px] font-medium tracking-[0.03em] text-[#8a837d] uppercase">Employee</th>

            <th className="px-3.5 py-2.5 text-left text-[8px] font-medium tracking-[0.03em] text-[#8a837d] uppercase">Role</th>

            <th className="px-3.5 py-2.5 text-left text-[8px] font-medium tracking-[0.03em] text-[#8a837d] uppercase">Department</th>

            <th className="px-3.5 py-2.5 text-left text-[8px] font-medium tracking-[0.03em] text-[#8a837d] uppercase">Shift</th>

            <th className="px-3.5 py-2.5 text-left text-[8px] font-medium tracking-[0.03em] text-[#8a837d] uppercase">Status</th>
          </tr>
        </thead>

        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={5} className="px-3.5 py-6 text-center text-[10px] text-[#8a837d]">
                Loading staff…
              </td>
            </tr>
          )}

          {isError && (
            <tr>
              <td colSpan={5} className="px-3.5 py-6 text-center text-[10px] text-red-500">
                Failed to load staff.
              </td>
            </tr>
          )}

          {!isLoading && !isError && staff.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3.5 py-6 text-center text-[10px] text-[#8a837d]">
                No staff found.
              </td>
            </tr>
          )}

          {staff.map((employee: any) => (
            <tr key={employee.id} className="border-t border-[#efedeb] transition hover:bg-[#fcfbfa]">
              <td className="px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[#f1f1f1] text-[9px] font-bold text-[#47423f]">
                    {employee.name
                      ? employee.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'NA'}
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-[#393430]">{employee.name || 'Unnamed'}</p>

                    <p className="text-[8px] text-[#958e88]">{employee.email}</p>
                  </div>
                </div>
              </td>

              <td className="px-3.5 py-2.5 text-[9px] font-medium text-[#514b46]">{employee.staffRole || '—'}</td>

              <td className="px-3.5 py-2.5 text-[9px] text-[#514b46]">{employee.department || '—'}</td>

              <td className="px-3.5 py-2.5 text-[9px] text-[#514b46]">{employee.shift ?? '—'}</td>

              <td className="px-3.5 py-2.5">
                <span className="inline-flex rounded-full bg-[#e4f8ef] px-2 py-1 text-[8px] font-semibold text-[#13895c]">{employee.role || 'STAFF'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RolesTab() {
  const { staff, isLoading, isError } = useStaffList();

  if (isLoading) {
    return <div className="px-3 py-10 text-center text-[10px] text-[#8a837d]">Loading roles…</div>;
  }

  if (isError) {
    return <div className="px-3 py-10 text-center text-[10px] text-red-500">Failed to load roles.</div>;
  }

  const roleMap: Record<string, any> = {};

  staff.forEach((employee: any) => {
    if (!employee.staffRole) {
      return;
    }

    if (!roleMap[employee.staffRole]) {
      roleMap[employee.staffRole] = {
        name: employee.staffRole,
        label: employee.staffRoleLabel || employee.staffRole,
        department: employee.department,
        description: employee.description,
        color: employee.color,
        count: 0,
        permissions: employee.permissions || [],
        permissionCount: employee.permissionCount || 0,
      };
    }

    roleMap[employee.staffRole].count += 1;
  });

  const roles = Object.values(roleMap);

  if (roles.length === 0) {
    return <div className="px-3 py-10 text-center text-[10px] text-[#8a837d]">No staff roles found.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
      {roles.map((role: any) => (
        <div key={role.name} className="rounded-[12px] border border-[#e8e5e2] bg-white p-3 transition hover:border-[#d8d2cd] hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[11px] font-semibold text-[#35302c]">{role.label}</h3>

              <p className="mt-0.5 text-[8px] font-medium text-[#8d867f]">{role.name}</p>

              <p className="mt-1 text-[8px] text-[#8d867f]">{role.department || 'No department'}</p>
            </div>

            <span className="shrink-0 rounded-full bg-[#e9e7e5] px-2 py-1 text-center text-[8px] font-medium text-[#625d58]">{role.count} staff</span>
          </div>

          <p className="mt-2 text-[8.5px] leading-[1.5] text-[#706963]">{role.description}</p>

          <div className="mt-3 border-t border-[#efedeb] pt-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[8px] font-medium text-[#706963]">Permissions</p>

              <span className="rounded-full bg-[#f4f1ef] px-2 py-1 text-[8px] font-semibold text-[#514b46]">{role.permissionCount}</span>
            </div>

            <div className="mt-2 space-y-1.5">
              {role.permissions.map((permission: any) => (
                <div key={permission.area} className="flex items-center justify-between rounded-[7px] bg-[#faf9f8] px-2 py-1.5">
                  <span className="text-[8px] text-[#514b46]">{permission.area}</span>

                  <PermissionBadge value={permission.level} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PermissionsTab({ permissions, isLoading }: { permissions: any[]; isLoading: boolean }) {
  if (isLoading) {
    return <div className="px-3 py-10 text-center text-[10px] text-[#8a837d]">Loading permissions…</div>;
  }

  if (permissions.length === 0) {
    return <div className="px-3 py-10 text-center text-[10px] text-[#8a837d]">No permissions found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="bg-[#faf9f8]">
            <th className="w-[26%] px-3.5 py-2.5 text-left text-[8px] font-medium text-[#8a837d]">Permission</th>

            <th className="px-3.5 py-2.5 text-left text-[8px] font-medium text-[#8a837d]">Super Admin</th>

            <th className="px-3.5 py-2.5 text-left text-[8px] font-medium text-[#8a837d]">Ops Manager</th>

            <th className="px-3.5 py-2.5 text-left text-[8px] font-medium text-[#8a837d]">Processor</th>

            <th className="px-3.5 py-2.5 text-left text-[8px] font-medium text-[#8a837d]">Support</th>
          </tr>
        </thead>

        <tbody>
          {permissions.map((permission: any, index: number) => (
            <tr key={permission.id || permission.area || permission.name || index} className="border-t border-[#efedeb] hover:bg-[#fcfbfa]">
              <td className="px-3.5 py-2.5 text-[9px] font-semibold text-[#393430]">{permission.area || permission.name || permission.resource || '—'}</td>

              <td className="px-3.5 py-2.5">
                <PermissionBadge value={permission.superAdmin || permission.SuperAdmin || 'None'} />
              </td>

              <td className="px-3.5 py-2.5">
                <PermissionBadge value={permission.opsManager || permission.OpsManager || 'None'} />
              </td>

              <td className="px-3.5 py-2.5">
                <PermissionBadge value={permission.processor || permission.Processor || 'None'} />
              </td>

              <td className="px-3.5 py-2.5">
                <PermissionBadge value={permission.support || permission.Support || 'None'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyTab({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f1ef] text-[#706862]">{icon}</div>

      <h3 className="mt-3 text-sm font-semibold text-[#393430]">{title}</h3>

      <p className="mt-1 max-w-sm text-[10px] text-[#8d867f]">{description}</p>
    </div>
  );
}
