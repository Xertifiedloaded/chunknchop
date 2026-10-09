"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  ClipboardList,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Megaphone,
  Package,
  Plus,
  Search,
  Settings,
  Tags,
  Truck,
  UserCog,
  UsersRound,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useAuthStore } from "@/store/authStore";
import { useAdminCounts } from "@/hooks/useAdminCounts";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  countKey?: string;
  hideZero?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Orders",
        href: "/admin/orders",
        icon: ClipboardList,
        countKey: "orders",
        hideZero: true,
      },
      {
        label: "Processing Queue",
        href: "/admin/processing",
        icon: Boxes,
        countKey: "processing",
        hideZero: true,
      },
      {
        label: "Delivery",
        href: "/admin/delivery",
        icon: Truck,
        countKey: "delivery",
        hideZero: true,
      },
    ],
  },
  {
    label: "Catalogue",
    items: [
      {
        label: "Products",
        href: "/admin/products",
        icon: Package,
        countKey: "products",
      },
      {
        label: "Categories",
        href: "/admin/categories",
        icon: Tags,
        countKey: "categories",
      },
      {
        label: "Inventory",
        href: "/admin/inventory",
        icon: Warehouse,
        countKey: "inventory",
        hideZero: true,
      },
    ],
  },
  {
    label: "Growth",
    items: [
      {
        label: "Customers",
        href: "/admin/customers",
        icon: UsersRound,
        countKey: "customers",
      },
      {
        label: "Promotions",
        href: "/admin/promotions",
        icon: Megaphone,
        countKey: "promotions",
      },
      {
        label: "Content Management",
        href: "/admin/content",
        icon: FileText,
        countKey: "content",
      },
      {
        label: "Reports & Analytics",
        href: "/admin/reports",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Staff Management",
        href: "/admin/staff",
        icon: UserCog,
        countKey: "staff",
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export const SIDEBAR_WIDTH = "w-60";
const SIDEBAR_WIDTH_PX = "15rem";

function isItemActive(pathname: string, searchParams: URLSearchParams, href: string) {
  const [base, queryString] = href.split("?");

  if (base === "/admin") {
    return pathname === "/admin";
  }

  if (!pathname.startsWith(base)) {
    return false;
  }

  const hrefParams = new URLSearchParams(queryString || "");
  const hrefTab = hrefParams.get("tab");
  const currentTab = searchParams.get("tab");

  if (hrefTab) {
    return currentTab === hrefTab;
  }

  return !currentTab;
}

function getInitials(name: string | null | undefined, email?: string | null) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);

    const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2);

    return initials.toUpperCase();
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "??";
}

function formatRole(role: string | undefined) {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "SUPPLIER":
      return "Supplier";
    case "STAFF":
      return "Staff";
    case "CUSTOMER":
      return "Customer";
    default:
      return "Guest";
  }
}

function formatCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

export default function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const counts = useAdminCounts();

  const coldRooms = counts.coldRooms;

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="fixed top-2 left-2.5 z-50 flex h-7 w-7 items-center justify-center rounded-md bg-charcoal text-white shadow-sm lg:hidden"
      >
        <Menu size={14} strokeWidth={2} />
      </button>

      {mobileOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden" />}

      <aside
        className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-[var(--color-sidebar)] text-white shadow-xl transition-transform duration-200 ease-out lg:translate-x-0 lg:shadow-none`}
        style={{ width: SIDEBAR_WIDTH_PX }}
      >
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 px-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand text-xs font-black">C</div>

          <div className="min-w-0">
            <div className="truncate text-[11px] leading-tight font-bold">
              <Link href="/" className="truncate text-[11px] leading-tight font-bold">
                ChunkNChop
              </Link>
            </div>

            <div className="truncate text-[8px] leading-tight text-[#aaa39d]">Operations Console</div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#bdb8b2] hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={14} />
          </button>
        </div>

        <nav className="flex-1 scrollbar-thin overflow-y-auto px-2 py-2">
          {sections.map((section) => (
            <div key={section.label} className="mb-2.5 last:mb-0">
              <div className="px-2 py-1 text-[8px] font-semibold tracking-[0.14em] text-[#8d8882] uppercase">{section.label}</div>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isItemActive(pathname, searchParams, item.href);

                  const Icon = item.icon;

                  const count = item.countKey ? counts[item.countKey] : undefined;
                  const showBadge = count != null && !(item.hideZero && count === 0);

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`group flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-[11px] transition-colors ${active ? "bg-[#403b37] text-white" : "text-[#bdb8b2] hover:bg-white/5 hover:text-white"}`}
                    >
                      {Icon && <Icon size={13} strokeWidth={1.8} className="shrink-0" />}

                      <span className="min-w-0 flex-1 truncate whitespace-nowrap">{item.label}</span>

                      {showBadge && (
                        <span
                          className={`ml-auto shrink-0 rounded-full px-1.5 py-[2px] text-[8px] leading-none font-semibold whitespace-nowrap ${active ? "bg-brand text-white" : "bg-white/10 text-[#d0cbc5]"}`}
                        >
                          {formatCount(count)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 px-2 py-2">
          <div className="rounded-md bg-[#38332f] p-2">
            <div className="flex items-center gap-1.5 text-[8px] font-semibold text-white">
              <span>❄️</span>
              <span className="whitespace-nowrap">Cold chain healthy</span>
            </div>

            <p className="mt-0.5 text-[8px] leading-3.5 text-[#aaa39d]">
              {coldRooms != null ? `${coldRooms} active storage ${coldRooms === 1 ? "location" : "locations"} within range.` : "Checking storage locations..."}
            </p>
          </div>

          <Link href="/admin/help" onClick={() => setMobileOpen(false)} className="mt-1 flex h-7 items-center gap-2 rounded-md px-2 text-[10px] text-[#bdb8b2] hover:bg-white/5 hover:text-white">
            <HelpCircle size={13} strokeWidth={1.8} />
            <span className="whitespace-nowrap">Help &amp; Support</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

export function AdminTopbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.name || user?.email || "Loading...";
  const initials = getInitials(user?.name, user?.email);
  const roleLabel = formatRole(user?.role);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [userMenuOpen]);

  async function handleLogout() {
    try {
      const csrf = (function () {
        if (typeof document === "undefined") return null;
        const name = "csrfToken=";
        const ca = document.cookie.split(";");
        for (let c of ca) {
          c = c.trim();
          if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return null;
      })();

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
      });
    } catch (error) {
      console.error("Logout failed:", error);

      toast.error("Logout request failed");
    } finally {
      logout();
      setUserMenuOpen(false);
      router.push("/auth/login");
    }
  }

  return (
    <header className="fixed top-0 right-0 left-0 z-30 h-11 border-b border-black/10 bg-white/95 backdrop-blur lg:left-[15rem]">
      <div className="relative flex h-full min-w-0 items-center justify-between gap-1.5 pr-2.5 pl-12 sm:gap-2 sm:pr-3 lg:pr-4 lg:pl-3.5">
        <div className="relative hidden w-full max-w-64 sm:block">
          <Search size={13} strokeWidth={1.8} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-[#aaa39c]" />

          <input
            id="admin-topbar-search"
            name="admin-topbar-search"
            autoComplete="off"
            suppressHydrationWarning
            className="h-7 w-full rounded-md border border-black/20 bg-white pr-10 pl-8 text-[10px] outline-none placeholder:text-[#aaa39c] focus:border-brand focus:ring-2 focus:ring-brand/10"
            placeholder="Search orders, products, customers..."
          />

          <span className="absolute top-1/2 right-1.5 hidden -translate-y-1/2 rounded border border-ink px-1 py-0.5 text-[7px] leading-none whitespace-nowrap text-ink md:inline-block">⌘ K</span>
        </div>

        <div
          className={`absolute top-1/2 left-12 z-20 flex h-7 -translate-y-1/2 items-center overflow-hidden transition-[width] duration-300 ease-out sm:hidden ${mobileSearchOpen ? "w-[calc(100%-3.5rem)]" : "w-7"}`}
        >
          <div
            className={`flex h-7 w-full items-center overflow-hidden rounded-md border bg-white transition-[border-color,box-shadow] duration-200 ${mobileSearchOpen ? "border-black/20 shadow-sm" : "border-black/15"}`}
          >
            <button
              type="button"
              aria-label={mobileSearchOpen ? "Close search" : "Open search"}
              onClick={() => setMobileSearchOpen((open) => !open)}
              className="flex h-7 w-7 shrink-0 items-center justify-center text-ink"
            >
              {mobileSearchOpen ? <X size={13} strokeWidth={2} /> : <Search size={13} strokeWidth={2} />}
            </button>

            <input
              id="admin-mobile-search"
              name="admin-mobile-search"
              autoComplete="off"
              placeholder="Search orders, products..."
              className={`h-full min-w-0 flex-1 bg-transparent pr-2 text-[10px] transition-opacity duration-200 outline-none placeholder:text-[#aaa39c] ${mobileSearchOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
              tabIndex={mobileSearchOpen ? 0 : -1}
            />
          </div>
        </div>

        <div className={`ml-auto flex min-w-0 shrink-0 items-center gap-1.5 text-[10px] sm:gap-2`}>
          <button type="button" className="hidden h-7 items-center gap-1 rounded-md bg-brand px-2 text-[10px] font-bold whitespace-nowrap text-white md:flex">
            <Plus size={12} strokeWidth={2} />

            <span>Quick Actions</span>

            <ChevronDown size={10} strokeWidth={2} />
          </button>

          <button type="button" aria-label="Quick actions" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-white md:hidden">
            <Plus size={14} strokeWidth={2} />
          </button>

          <button type="button" aria-label="Messages" className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink sm:flex">
            <Mail size={14} strokeWidth={1.8} />
          </button>

          <button type="button" aria-label="Notifications" className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink">
            <Bell size={14} strokeWidth={1.8} />

            <span className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-[#d94645] text-[6px] font-bold text-white">4</span>
          </button>

          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((open) => !open)}
              aria-label="Open user menu"
              aria-expanded={userMenuOpen}
              className="hidden min-w-0 items-center gap-1.5 rounded-md px-1 py-1 hover:bg-black/5 sm:flex"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand text-[8px] font-bold text-white">{initials}</span>

              <div className="min-w-0 text-left text-charcoal">
                <div className="max-w-24 truncate text-[10px] leading-tight font-semibold whitespace-nowrap">{displayName}</div>

                <div className="truncate text-[8px] leading-tight whitespace-nowrap text-charcoal">{roleLabel}</div>
              </div>

              <ChevronDown size={10} strokeWidth={2} className={`hidden shrink-0 text-ink transition-transform duration-200 md:block ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setUserMenuOpen((open) => !open)}
              aria-label="Open user menu"
              aria-expanded={userMenuOpen}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand text-[8px] font-bold text-white sm:hidden"
            >
              {initials}
            </button>

            {userMenuOpen && (
              <div className="absolute top-full right-0 z-40 mt-2 w-44 overflow-hidden rounded-md border border-black/10 bg-white shadow-lg">
                <div className="border-b border-black/10 px-3 py-2">
                  <p className="truncate text-[10px] font-semibold text-charcoal">{displayName}</p>
                  <p className="truncate text-[9px] text-[#8d8882]">{roleLabel}</p>
                </div>

                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-red-500 hover:bg-red-50">
                  <LogOut size={12} strokeWidth={1.8} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}