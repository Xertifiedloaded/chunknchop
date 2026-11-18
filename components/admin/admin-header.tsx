'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Boxes,
  ChevronDown,
  Mail,
  Package,
  Plus,
  Search,
  Send,
  ShoppingBag,
  Ticket,
  UserRound,
  Settings,
} from 'lucide-react';

import SignOutButton from '@/components/auth/sign-out-button';

type AdminHeaderProps = {
  name: string;
  role: string;
  unreadMessages?: boolean;
  notificationCount?: number;
};

const quickActions = [
  { label: 'Add Product', href: '/admin/products/new', icon: Package },
  { label: 'Create Coupon', href: '/admin/coupons/new', icon: Ticket },
  { label: 'View Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Add Inventory', href: '/admin/inventory', icon: Boxes },
  { label: 'Send Promotion', href: '/admin/promotions/new', icon: Send },
];

function shortName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return 'Admin';
  if (parts.length === 1) return parts[0];

  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function initials(full: string) {
  return (
    full
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'AD'
  );
}

export default function AdminHeader({
  name,
  role,
  unreadMessages = false,
  notificationCount = 0,
}: AdminHeaderProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [quickOpen, setQuickOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notices, setNotices] = useState<
    Array<{
      _id: string;
      title: string;
      body: string;
      url: string;
      read?: boolean;
      createdAt: string;
    }>
  >([]);
  const [noticeUnread, setNoticeUnread] = useState(0);
  const [noticeBusy, setNoticeBusy] = useState(false);

  async function loadNotices() {
    const r = await fetch('/api/notifications', { cache: 'no-store' });
    if (!r.ok) return;
    const j = await r.json();
    setNotices(j.notifications || []);
    setNoticeUnread(j.unread || 0);
  }

  useEffect(() => {
    void loadNotices();
    const refresh = window.setInterval(() => {
      void loadNotices();
    }, 60000);
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if (e.key === 'Escape') {
        setQuickOpen(false);
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;

      if (quickRef.current && !quickRef.current.contains(target)) {
        setQuickOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      window.clearInterval(refresh);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-[58px] w-full items-center justify-between gap-3 border-b border-[#eeece8] bg-white/95 px-3 backdrop-blur-md sm:px-5 lg:h-[62px] lg:px-7">
      {}
      <div className="min-w-0 flex-1">
        <label className="relative flex h-9 w-full max-w-[400px] items-center rounded-lg border border-[#eeeae6] bg-[#faf9f7] transition focus-within:border-[#e8a58c] focus-within:bg-white">
          <Search className="pointer-events-none absolute left-3 size-3.5 text-[#aaa39b]" />

          <input
            ref={searchRef}
            type="search"
            placeholder="Search orders, products, customers..."
            className="h-full w-full bg-transparent pl-9 pr-12 text-[11px] text-[#302b27] outline-none placeholder:text-[#aaa39b] sm:text-xs"
          />

          <kbd className="absolute right-2 hidden items-center gap-0.5 rounded border border-[#eae6e1] bg-white px-1.5 py-0.5 text-[9px] font-medium text-[#969089] sm:flex">
            ⌘ K
          </kbd>
        </label>
      </div>

      {}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        {}
        <div ref={quickRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={quickOpen}
            onClick={() => {
              setQuickOpen((v) => !v);
              setProfileOpen(false);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#D2582F] px-2.5 text-[10px] font-semibold text-white transition hover:bg-[#BD4D27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D2582F] focus-visible:ring-offset-2 sm:h-9 sm:gap-2 sm:px-3.5 sm:text-[11px]"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Quick Actions</span>
            <ChevronDown
              size={13}
              className={`transition-transform ${quickOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {quickOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-[#eeeae6] bg-white p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.10)]"
            >
              <p className="px-2.5 pb-2 pt-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#aaa199]">
                Quick Actions
              </p>

              {quickActions.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  role="menuitem"
                  onClick={() => setQuickOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11px] font-medium text-[#49423c] transition hover:bg-[#fff5f0] hover:text-[#D2582F]"
                >
                  <span className="flex size-7 items-center justify-center rounded-md bg-[#fff1eb] text-[#D2582F]">
                    <Icon size={14} />
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {}
        <button
          type="button"
          aria-label="Messages"
          className="relative flex size-8 items-center justify-center rounded-lg text-[#817a72] transition hover:bg-[#f7f5f2] hover:text-[#D2582F] sm:size-9"
        >
          <Mail size={16} strokeWidth={1.8} />

          {unreadMessages && (
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#D2582F] ring-2 ring-white" />
          )}
        </button>

        {}
        <div className="relative">
          <button
            type="button"
            aria-label={`Notifications, ${noticeUnread} unread`}
            onClick={() => {
              const next = !notificationsOpen;
              setNotificationsOpen(next);
              setQuickOpen(false);
              setProfileOpen(false);
              if (next) void loadNotices();
            }}
            className="relative flex size-8 items-center justify-center rounded-lg text-[#817a72] transition hover:bg-[#f7f5f2] hover:text-[#D2582F] sm:size-9"
          >
            <Bell size={16} strokeWidth={1.8} />
            {noticeUnread > 0 && (
              <span className="absolute right-0 top-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#D4474B] px-1 text-[8px] font-bold text-white ring-2 ring-white">
                {noticeUnread > 9 ? '9+' : noticeUnread}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <section className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-[#eee8e2] bg-white shadow-[0_18px_50px_rgba(0,0,0,.16)]">
              <div className="flex items-center justify-between border-b border-[#f0ece7] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#302923]">Notification history</p>
                  <p className="text-[10px] text-[#958b82]">{noticeUnread} unread</p>
                </div>
                <button
                  disabled={noticeBusy || notices.length === 0}
                  onClick={async () => {
                    setNoticeBusy(true);
                    try {
                      const r = await fetch('/api/notifications', { method: 'DELETE' });
                      if (r.ok) {
                        setNotices([]);
                        setNoticeUnread(0);
                      }
                    } finally {
                      setNoticeBusy(false);
                    }
                  }}
                  className="text-[11px] font-semibold text-[#b44d31] disabled:opacity-40"
                >
                  Clear history
                </button>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {notices.length === 0 ? (
                  <p className="p-8 text-center text-xs text-[#958b82]">No notifications yet.</p>
                ) : (
                  notices.map((n) => (
                    <a
                      key={n._id}
                      href={n.url || '/admin'}
                      onClick={() => {
                        if (!n.read)
                          void fetch('/api/notifications', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: n._id }),
                          }).then(loadNotices);
                        setNotificationsOpen(false);
                      }}
                      className={`block border-b border-[#f4f0ec] px-4 py-3 hover:bg-[#fcf8f5] ${n.read ? '' : 'bg-[#fff8f4]'}`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-[#D2582F]'}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-[#39312b]">
                            {n.title}
                          </span>
                          <span className="mt-1 block text-[11px] leading-4 text-[#766d64]">
                            {n.body}
                          </span>
                          <span className="mt-1.5 block text-[9px] text-[#a39a91]">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </span>
                      </div>
                    </a>
                  ))
                )}
              </div>
              <div className="border-t border-[#f0ece7] p-2 text-center">
                <button
                  onClick={() => {
                    void fetch('/api/notifications', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ all: true }),
                    }).then(loadNotices);
                  }}
                  className="text-[10px] font-semibold text-[#8b5140]"
                >
                  Mark all as read
                </button>
              </div>
            </section>
          )}
        </div>

        {}
        <div className="mx-1 hidden h-7 w-px bg-[#eeeae6] sm:block" />

        {}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen((v) => !v);
              setQuickOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-[#f8f6f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D2582F]"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#5A1F2B] text-[10px] font-bold text-white sm:size-[34px]">
              {initials(name)}
            </span>

            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-[120px] truncate text-[11px] font-semibold text-[#332d28]">
                {shortName(name)}
              </span>
              <span className="mt-0.5 block max-w-[120px] truncate text-[9px] text-[#99918a]">
                {role}
              </span>
            </span>

            <ChevronDown
              size={13}
              className={`hidden text-[#a69e96] transition-transform sm:block ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-[#eeeae6] bg-white shadow-[0_12px_35px_rgba(0,0,0,0.10)]"
            >
              {}
              <div className="flex items-center gap-3 border-b border-[#f1eeeb] px-4 py-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#5A1F2B] text-xs font-bold text-white">
                  {initials(name)}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#332d28]">{name}</p>
                  <p className="mt-1 truncate text-[10px] text-[#99918a]">{role}</p>
                </div>
              </div>

              {}
              <div className="space-y-0.5 p-1.5">
                <Link
                  href="/admin/settings"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[11px] font-medium text-[#514a44] transition hover:bg-[#faf8f6]"
                >
                  <Settings size={15} className="text-[#948a80]" />
                  Account Settings
                </Link>

                <Link
                  href="/"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[11px] font-medium text-[#514a44] transition hover:bg-[#faf8f6]"
                >
                  <UserRound size={15} className="text-[#948a80]" />
                  View Store
                </Link>
              </div>

              {}
              <div className="border-t border-[#f1eeeb] p-2">
                <SignOutButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
