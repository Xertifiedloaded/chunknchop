export type Role = "CUSTOMER" | "SUPPLIER" | "STAFF" | "ADMIN";

interface RouteRule {
  prefix: string;
  roles: Role[] | null;
}

const PAGE_RULES: RouteRule[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/supplier", roles: ["SUPPLIER", "ADMIN"] },
  { prefix: "/staff", roles: ["STAFF", "ADMIN"] },
  { prefix: "/orders", roles: null },
  { prefix: "/account", roles: null },
];

const API_RULES: RouteRule[] = [
  { prefix: "/api/admin", roles: ["ADMIN"] },
  { prefix: "/api/supplier", roles: ["SUPPLIER", "ADMIN"] },
  { prefix: "/api/staff", roles: ["STAFF", "ADMIN"] },
  { prefix: "/api/customer", roles: null },
];

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function findRule(pathname: string): RouteRule | null {
  const rules = pathname.startsWith("/api/") ? API_RULES : PAGE_RULES;
  return rules.find((rule) => matches(pathname, rule.prefix)) ?? null;
}

export function isAllowed(rule: RouteRule, role: string) {
  return !rule.roles || rule.roles.includes(role as Role);
}

export function isProtectedPage(pathname: string) {
  return PAGE_RULES.some((rule) => matches(pathname, rule.prefix));
}
