'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, BarChart3, Menu, X } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isItemActive = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="border-b border-[var(--color-charcoal)]/10 bg-[var(--color-charcoal)] text-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">ChunkNChop</span>
          <span className="hidden text-sm text-white/50 sm:inline">Admin Panel</span>
        </div>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-sand text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile toggle */}
        <button type="button" onClick={() => setMobileOpen((v) => !v)} className="flex items-center justify-center rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white lg:hidden" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <ul className="space-y-1 border-t border-white/10 px-4 pt-2 pb-4 lg:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-sand text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
