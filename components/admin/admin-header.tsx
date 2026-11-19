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
  CheckCheck,
  Trash2,
  X,
} from 'lucide-react';

import SignOutButton from '@/components/auth/sign-out-button';

type AdminHeaderProps = {
  name: string;
  role: string;
  unreadMessages?: boolean;
  notificationCount?: number;
};

type Notice = {
  _id: string;
  title: string;
  body: string;
  url: string;
  read?: boolean;
  createdAt: string;
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

function formatNoticeDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminHeader({ name, role, unreadMessages = false }: AdminHeaderProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [quickOpen, setQuickOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticeUnread, setNoticeUnread] = useState(0);
  const [noticeBusy, setNoticeBusy] = useState(false);

  async function loadNotices() {
    try {
      const response = await fetch('/api/notifications', {
        cache: 'no-store',
      });

      if (!response.ok) return;

      const data = await response.json();

      setNotices(data.notifications || []);
      setNoticeUnread(data.unread || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  async function markAllAsRead() {
    try {
      setNoticeBusy(true);

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ all: true }),
      });

      if (response.ok) {
        await loadNotices();
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    } finally {
      setNoticeBusy(false);
    }
  }

  async function clearHistory() {
    try {
      setNoticeBusy(true);

      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotices([]);
        setNoticeUnread(0);
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    } finally {
      setNoticeBusy(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      await loadNotices();
    } catch (error) {
      console.error('Failed to update notification:', error);
    }
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

      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }

      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
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
    <header className="sticky top-0 z-40 flex h-[58px] w-full items-center justify-between gap-2 border-b border-[#eeece8] bg-white/95 px-3 backdrop-blur-md sm:h-[62px] sm:gap-3 sm:px-5 lg:px-7">
      {}
      <div className="min-w-0 flex-1">
        <label className="relative flex h-9 w-full max-w-[400px] items-center rounded-lg border border-[#eeeae6] bg-[#faf9f7] transition focus-within:border-[#e8a58c] focus-within:bg-white">
          <Search className="pointer-events-none absolute left-3 size-3.5 text-[#aaa39b]" />

          <input
            ref={searchRef}
            type="search"
            placeholder="Search orders, products, customers..."
            className="h-full w-full min-w-0 bg-transparent pl-9 pr-3 text-[10px] text-[#302b27] outline-none placeholder:text-[#aaa39b] sm:text-xs"
          />

          <kbd className="absolute right-2 hidden items-center gap-0.5 rounded border border-[#eae6e1] bg-white px-1.5 py-0.5 text-[9px] font-medium text-[#969089] sm:flex">
            ⌘ K
          </kbd>
        </label>
      </div>

      {}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
        {}
        <div ref={quickRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={quickOpen}
            onClick={() => {
              setQuickOpen((v) => !v);
              setProfileOpen(false);
              setNotificationsOpen(false);
            }}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand px-2 text-[9px] font-semibold text-white transition hover:bg-[#BD4D27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:h-9 sm:gap-2 sm:px-3.5 sm:text-[11px]"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Quick Actions</span>
            <ChevronDown
              size={12}
              className={`transition-transform ${quickOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {quickOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[#eeeae6] bg-white p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.10)]"
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
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[10px] font-medium text-[#49423c] transition hover:bg-[#fff5f0] hover:text-brand"
                >
                  <span className="flex size-7 items-center justify-center rounded-md bg-[#fff1eb] text-brand">
                    <Icon size={14} />
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {}
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            aria-label={`Notifications, ${noticeUnread} unread`}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            onClick={() => {
              const next = !notificationsOpen;

              setNotificationsOpen(next);
              setQuickOpen(false);
              setProfileOpen(false);

              if (next) void loadNotices();
            }}
            className={`relative flex size-8 shrink-0 items-center justify-center rounded-lg transition sm:size-9 ${
              notificationsOpen
                ? 'bg-[#fff1eb] text-brand'
                : 'text-[#817a72] hover:bg-[#f7f5f2] hover:text-brand'
            }`}
          >
            <Bell size={16} strokeWidth={1.8} />

            {noticeUnread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand px-1 text-[8px] font-bold text-white ring-2 ring-white">
                {noticeUnread > 9 ? '9+' : noticeUnread}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <section
              role="dialog"
              aria-label="Notification history"
              className="
                fixed left-3 right-3 top-[66px] z-[60]
                flex max-h-[min(75vh,560px)] flex-col
                overflow-hidden rounded-2xl border border-[#eee8e2]
                bg-white shadow-[0_18px_50px_rgba(0,0,0,0.16)]
                sm:absolute sm:left-auto sm:right-0 sm:top-full
                sm:mt-2 sm:w-[360px] sm:max-h-[min(70vh,520px)]
              "
            >
              {}
              <div className="flex shrink-0 items-center justify-between border-b border-[#f0ece7] px-3.5 py-3 sm:px-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#fff1eb] text-brand">
                    <Bell size={15} />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#302923] sm:text-xs">Notifications</p>
                    <p className="mt-0.5 text-[9px] text-[#958b82]">
                      {noticeUnread} unread notification{noticeUnread === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    disabled={noticeBusy || notices.length === 0}
                    onClick={() => void clearHistory()}
                    className="flex h-7 items-center gap-1 rounded-md px-2 text-[9px] font-semibold text-[#b44d31] transition hover:bg-[#fff3ed] disabled:opacity-40"
                  >
                    <Trash2 size={11} />
                    <span className="hidden xs:inline">Clear</span>
                  </button>

                  <button
                    type="button"
                    aria-label="Close notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex size-7 items-center justify-center rounded-md text-[#968d84] transition hover:bg-[#f5f2ef] hover:text-[#39312b]"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {notices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                    <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#faf5f1] text-[#c4a99b]">
                      <Bell size={19} />
                    </span>

                    <p className="text-[11px] font-semibold text-[#554c45]">All caught up</p>

                    <p className="mt-1 text-[10px] text-[#a0978e]">
                      You have no notifications right now.
                    </p>
                  </div>
                ) : (
                  notices.map((notice) => (
                    <a
                      key={notice._id}
                      href={notice.url || '/admin'}
                      onClick={() => {
                        if (!notice.read) {
                          void markAsRead(notice._id);
                        }

                        setNotificationsOpen(false);
                      }}
                      className={`group block border-b border-[#f4f0ec] px-3.5 py-3 transition hover:bg-[#fcf8f5] sm:px-4 ${
                        notice.read ? 'bg-white' : 'bg-[#fffaf7]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${
                            notice.read ? 'bg-[#e6e1dc]' : 'bg-brand'
                          }`}
                        />

                        <span className="min-w-0 flex-1">
                          <span className="block break-words text-[10px] font-semibold leading-4 text-[#39312b] sm:text-[11px]">
                            {notice.title}
                          </span>

                          <span className="mt-1 block break-words text-[10px] leading-[1.55] text-[#766d64]">
                            {notice.body}
                          </span>

                          <span className="mt-1.5 block text-[9px] text-[#a39a91]">
                            {formatNoticeDate(notice.createdAt)}
                          </span>
                        </span>

                        {!notice.read && (
                          <span className="mt-1 shrink-0 rounded-full bg-[#fff0e9] px-1.5 py-0.5 text-[8px] font-semibold text-[#c15b39]">
                            New
                          </span>
                        )}
                      </div>
                    </a>
                  ))
                )}
              </div>

              {}
              {notices.length > 0 && (
                <div className="flex shrink-0 items-center justify-between border-t border-[#f0ece7] bg-[#fdfcfb] px-3.5 py-2.5 sm:px-4">
                  <span className="text-[9px] text-[#a0978e]">
                    {notices.length} notification{notices.length === 1 ? '' : 's'}
                  </span>

                  <button
                    type="button"
                    disabled={noticeBusy || noticeUnread === 0}
                    onClick={() => void markAllAsRead()}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[9px] font-semibold text-[#98513c] transition hover:bg-[#fff1eb] disabled:opacity-40"
                  >
                    <CheckCheck size={12} />
                    Mark all as read
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        {}
        <div className="mx-0.5 hidden h-7 w-px bg-[#eeeae6] sm:block" />

        {}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen((v) => !v);
              setQuickOpen(false);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-1.5 rounded-lg p-1 transition hover:bg-[#f8f6f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:gap-2"
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
              size={12}
              className={`hidden text-[#a69e96] transition-transform sm:block ${
                profileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[#eeeae6] bg-white shadow-[0_12px_35px_rgba(0,0,0,0.10)]"
            >
              <div className="flex items-center gap-3 border-b border-[#f1eeeb] px-4 py-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#5A1F2B] text-xs font-bold text-white">
                  {initials(name)}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#332d28]">{name}</p>

                  <p className="mt-1 truncate text-[10px] text-[#99918a]">{role}</p>
                </div>
              </div>

              <div className="space-y-0.5 p-1.5">
                <Link
                  href="/admin/settings"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[10px] font-medium text-[#514a44] transition hover:bg-[#faf8f6]"
                >
                  <Settings size={14} className="text-[#948a80]" />
                  Account Settings
                </Link>

                <Link
                  href="/"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[10px] font-medium text-[#514a44] transition hover:bg-[#faf8f6]"
                >
                  <UserRound size={14} className="text-[#948a80]" />
                  View Store
                </Link>
              </div>

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
