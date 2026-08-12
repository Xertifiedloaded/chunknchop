export type PermissionLevel = 'Full' | 'Edit' | 'View' | 'Approve' | 'Request' | 'None';

export type PermissionArea = 'Orders' | 'Processing Queue' | 'Inventory' | 'Customers' | 'Refunds' | 'Promotions' | 'Settings';

export const PERMISSION_AREAS: PermissionArea[] = ['Orders', 'Processing Queue', 'Inventory', 'Customers', 'Refunds', 'Promotions', 'Settings'];

export const STAFF_ROLES = ['SUPER_ADMIN', 'OPS_MANAGER', 'PROCESSOR', 'SUPPORT', 'RIDER', 'BUTCHER', 'WAREHOUSE'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export interface RoleMeta {
  label: string;
  department: string;
  description: string;
  color: string; // tailwind-safe token used for badges
}

export const ROLE_META: Record<StaffRole, RoleMeta> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    department: 'Management',
    description: 'Full system access across all departments, including settings and staff management.',
    color: 'violet',
  },
  OPS_MANAGER: {
    label: 'Ops Manager',
    department: 'Operations',
    description: 'Manages orders, processing queue, and inventory. Can approve refunds and view customer data.',
    color: 'blue',
  },
  PROCESSOR: {
    label: 'Processor',
    department: 'Processing',
    description: 'Handles the processing queue and views orders and inventory for day-to-day cutting operations.',
    color: 'amber',
  },
  SUPPORT: {
    label: 'Support',
    department: 'Customer Support',
    description: 'Manages orders and customers, and can request refunds on behalf of customers.',
    color: 'emerald',
  },
  RIDER: {
    label: 'Rider',
    department: 'Logistics',
    description: 'Handles delivery logistics and order status updates while on shift.',
    color: 'sky',
  },
  BUTCHER: {
    label: 'Butcher',
    department: 'Processing',
    description: 'Prepares and preps cuts according to weight and spec, updates inventory as items are processed.',
    color: 'rose',
  },
  WAREHOUSE: {
    label: 'Warehouse',
    department: 'Warehouse',
    description: 'Oversees inventory intake, stock levels, and storage conditions.',
    color: 'stone',
  },
};

export const ROLE_PERMISSIONS: Record<StaffRole, Record<PermissionArea, PermissionLevel>> = {
  SUPER_ADMIN: {
    Orders: 'Full',
    'Processing Queue': 'Full',
    Inventory: 'Full',
    Customers: 'Full',
    Refunds: 'Full',
    Promotions: 'Full',
    Settings: 'Full',
  },
  OPS_MANAGER: {
    Orders: 'Full',
    'Processing Queue': 'Full',
    Inventory: 'Full',
    Customers: 'View',
    Refunds: 'Approve',
    Promotions: 'View',
    Settings: 'None',
  },
  PROCESSOR: {
    Orders: 'View',
    'Processing Queue': 'Edit',
    Inventory: 'View',
    Customers: 'None',
    Refunds: 'None',
    Promotions: 'None',
    Settings: 'None',
  },
  SUPPORT: {
    Orders: 'Edit',
    'Processing Queue': 'View',
    Inventory: 'None',
    Customers: 'Edit',
    Refunds: 'Request',
    Promotions: 'None',
    Settings: 'None',
  },
  RIDER: {
    Orders: 'Edit',
    'Processing Queue': 'None',
    Inventory: 'None',
    Customers: 'None',
    Refunds: 'None',
    Promotions: 'None',
    Settings: 'None',
  },
  BUTCHER: {
    Orders: 'None',
    'Processing Queue': 'View',
    Inventory: 'Edit',
    Customers: 'None',
    Refunds: 'None',
    Promotions: 'None',
    Settings: 'None',
  },
  WAREHOUSE: {
    Orders: 'None',
    'Processing Queue': 'None',
    Inventory: 'Full',
    Customers: 'None',
    Refunds: 'None',
    Promotions: 'None',
    Settings: 'None',
  },
};

const LEVEL_RANK: Record<PermissionLevel, number> = {
  None: 0,
  Request: 1,
  View: 1,
  Approve: 2,
  Edit: 2,
  Full: 3,
};

export function hasPermission(role: StaffRole, area: PermissionArea, min: PermissionLevel) {
  return LEVEL_RANK[ROLE_PERMISSIONS[role][area]] >= LEVEL_RANK[min];
}

export function permissionCount(role: StaffRole) {
  return Object.values(ROLE_PERMISSIONS[role]).filter((l) => l !== 'None').length;
}

export function roleOptions() {
  return STAFF_ROLES.map((r) => ({ value: r, label: ROLE_META[r].label }));
}
