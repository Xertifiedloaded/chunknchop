'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  Truck,
  Package,
  Tags,
  Boxes,
  Users,
  Megaphone,
  FileText,
  ChartNoAxesColumn,
  UserCog,
  Settings,
  LifeBuoy,
  Snowflake,
  Menu,
  X,
} from 'lucide-react';

import AdminHeader from '@/components/admin/admin-header';

const navigation = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { label: 'Coupons', href: '/admin/coupons', icon: ChefHat },
      { label: 'Delivery', href: '/admin/delivery', icon: Truck },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Categories', href: '/admin/categories', icon: Tags },
      { label: 'Payments', href: '/admin/payments', icon: Boxes },
    ],
  },
  {
    label: 'Growth',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Promotions', href: '/admin/promotions', icon: Megaphone },
      { label: 'Content Management', href: '/admin/content', icon: FileText },
      {
        label: 'Reports & Analytics',
        href: '/admin/reports',
        icon: ChartNoAxesColumn,
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Staff Management', href: '/admin/staff', icon: UserCog },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

function SidebarContent({
  pathname,
  onNavigate,
  onClose,
}: {
  pathname: string;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      {}
      <div
        className={`flex shrink-0 items-center justify-between border-b border-white/[0.07] px-4 ${
          onClose
            ? 'h-[calc(60px+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)]'
            : 'h-[60px]'
        }`}
      >
        <Link href="/admin" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e85d2a] text-sm font-bold text-white">
            C
          </span>

          <span className="min-w-0">
            <span className="block text-[13px] font-semibold tracking-tight text-white">
              ChunkNChop
            </span>
            <span className="mt-0.5 block text-[10px] text-[#aaa39a]">Operations Console</span>
          </span>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid size-9 place-items-center rounded-lg text-[#c2bbb2] transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {}
      <nav className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4">
        {navigation.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-2.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#898178]">
              {group.label}
            </p>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;

                const active =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-[12px] font-medium transition-all duration-150 ${
                      active
                        ? 'bg-[#403b37] text-white'
                        : 'text-[#c2bbb2] hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-y-2 left-0 w-[2px] rounded-r bg-[#e85d2a]" />
                    )}

                    <Icon size={15} strokeWidth={1.8} className="shrink-0" />

                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {}
      <div className="shrink-0 space-y-2.5 border-t border-white/[0.07] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="rounded-lg bg-[#38332f] p-3">
          <div className="flex items-center gap-2 text-[11px] font-medium text-white">
            <Snowflake size={14} className="shrink-0 text-sky-400" />
            Cold chain healthy
          </div>

          <p className="mt-1.5 text-[10px] leading-[1.6] text-[#aaa39a]">
            Monitor storage conditions and cold-room status.
          </p>
        </div>

        <Link
          href="/admin/settings"
          onClick={onNavigate}
          className="flex min-h-9 items-center gap-2 rounded-lg px-2 text-[11px] font-medium text-[#c2bbb2] transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          <LifeBuoy size={14} />
          Help & Support
        </Link>
      </div>
    </>
  );
}

export default function AdminShell({
  children,
  userEmail = '',
  userName = '',
  userRole = 'Admin',
  unreadMessages = false,
  notificationCount = 0,
}: {
  children: ReactNode;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  unreadMessages?: boolean;
  notificationCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');

    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };

    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="min-h-dvh bg-[#f5f6f8] text-[#292723]">
      {}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col bg-[#292622] text-white lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {}
      <header className="sticky top-0 z-30 flex h-[calc(56px+env(safe-area-inset-top))] items-center gap-3 border-b border-white/[0.07] bg-[#292622] px-3 pt-[env(safe-area-inset-top)] text-white sm:px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="admin-drawer"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Menu size={19} />
        </button>

        <Link href="/admin" className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#e85d2a] text-xs font-bold">
            C
          </span>

          <span className="truncate text-[13px] font-semibold">ChunkNChop</span>
        </Link>

        {userEmail && (
          <span
            title={userEmail}
            className="ml-auto grid size-8 shrink-0 place-items-center rounded-full bg-[#403b37] text-[11px] font-semibold uppercase"
          >
            {userEmail.charAt(0)}
          </span>
        )}
      </header>

      {}
      <div
        className={`fixed inset-0 z-50 transition-[visibility] duration-300 lg:hidden ${
          open ? 'visible' : 'pointer-events-none invisible'
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label="Close navigation"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <aside
          id="admin-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          className={`absolute inset-y-0 left-0 flex w-[260px] max-w-[85vw] flex-col overscroll-contain bg-[#292622] pl-[env(safe-area-inset-left)] text-white shadow-2xl transition-transform duration-300 ease-out ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent
            pathname={pathname}
            onNavigate={() => setOpen(false)}
            onClose={() => setOpen(false)}
          />
        </aside>
      </div>

      {}
      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-[232px]">
        {}
        <AdminHeader
          name={userName || userEmail || 'Admin'}
          role={userRole}
          unreadMessages={unreadMessages}
          notificationCount={notificationCount}
        />

        {}
        <main className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-5 lg:px-6 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
