"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, LogOut, Package, LayoutGrid, Menu, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import CartDropdown from "@/components/CartDropdown";
import { ROLE_STYLES } from "@/lib";

type Panel = "menu" | "search" | "cart" | "account" | null;
type SessionUser = {
  name?: string | null;
  email: string;
  role?: string;
  staffRole?: string | null;
};
type NavEntry = { label: string; href?: string; id?: string };

const NAV: NavEntry[] = [
  { label: "SHOP", href: "/shop" },
  { label: "MEATBOX", id: "meatbox" },
  { label: "HOW IT WORKS", id: "how" },
  { label: "FAQ", id: "faq" },
];

const ACCOUNT_LINKS = [
  { href: "/orders", label: "Orders" },
  { href: "/account/subscriptions", label: "Subscriptions" },
  { href: "/account/wholesale", label: "Wholesale" },
  { href: "/account/support", label: "Support" },
];

const WORKSPACE: Record<string, { href: string; label: string; Icon: typeof Package }> = {
  ADMIN: { href: "/admin", label: "Admin", Icon: LayoutGrid },
  SUPPLIER: { href: "/supplier/dashboard", label: "Dashboard", Icon: Package },
  STAFF: { href: "/staff/dashboard", label: "Staff Dashboard", Icon: Package },
};

const navCls = "text-[11px] font-bold tracking-[0.12em] transition hover:text-white";
const dropCls = "block px-4 py-2 text-[13px] font-medium text-[#c9beb7] transition hover:bg-white/5 hover:text-white";
const mobileCls = "block w-full text-left text-[13px] font-semibold tracking-wider transition hover:text-white";
const btnCls = "flex h-8 items-center justify-center px-3.5 text-[11px] font-black tracking-wider transition";
const mobileBtnCls = "flex-1 py-2.5 text-center text-xs font-black tracking-wider transition";

const AUTH_LINKS = [
  {
    href: "/auth/login",
    label: "LOG IN",
    desktop: `${btnCls} border border-white/50 hover:bg-white hover:text-black`,
    mobile: `${mobileBtnCls} border border-white/50 hover:bg-white hover:text-black`,
  },
  {
    href: "/auth/signup",
    label: "SIGN UP",
    desktop: `${btnCls} bg-white text-black hover:bg-[#e9e1d9]`,
    mobile: `${mobileBtnCls} bg-brand hover:bg-[#aa1f1b]`,
  },
];

const roleStyle = (role?: string) => ROLE_STYLES[role ?? ""] ?? ROLE_STYLES.CUSTOMER;

const firstName = (u: SessionUser) => u.name?.split(" ")[0] ?? u.email.split("@")[0];

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const roleLabel = (u: SessionUser) => (u.role === "STAFF" ? titleCase(u.staffRole ?? "Staff") : roleStyle(u.role).label);

const fade = (open: boolean, delayMs: number) => ({
  className: `transition-all duration-300 ease-out ${open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`,
  style: { transitionDelay: open ? `${delayMs}ms` : "0ms" },
});

function Avatar({ user, size }: { user: SessionUser; size: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white uppercase ${size} ${roleStyle(user.role).avatar}`}>
      {(user.name?.trim()?.[0] ?? user.email[0]).toUpperCase()}
    </span>
  );
}

function RoleBadge({ user }: { user: SessionUser }) {
  return <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold ${roleStyle(user.role).badge}`}>{roleLabel(user)}</span>;
}

function NavItem({ item, className, active, onScroll, onNavigate }: { item: NavEntry; className: string; active: boolean; onScroll: (id: string) => void; onNavigate: () => void }) {
  const cls = `${className} ${active ? "text-white" : "text-[#c9beb7]"}`;

  return item.href ? (
    <Link href={item.href} onClick={onNavigate} className={cls} aria-current={active ? "page" : undefined}>
      {item.label}
    </Link>
  ) : (
    <button type="button" onClick={() => onScroll(item.id!)} className={cls}>
      {item.label}
    </button>
  );
}

function MobileSection({ title, index, open, children }: { title?: string; index: number; open: boolean; children: ReactNode }) {
  const { className, style } = fade(open, 120 + index * 60);
  return (
    <div className={`mb-5 ${className}`} style={style}>
      {title && <p className="mb-2.5 text-[9px] font-bold tracking-[0.2em] text-[#7d6f66] uppercase">{title}</p>}
      <div className="flex flex-col gap-3.5">{children}</div>
    </div>
  );
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user) as SessionUser | null;
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const logout = useAuthStore((s) => s.logout);
  const cartItems = useCartStore((s) => s.items);
  const setCartItems = useCartStore((s) => s.setItems);

  const [panel, setPanel] = useState<Panel>(null);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const workspace = user?.role ? WORKSPACE[user.role] : undefined;
  const isInternal = user?.role === "SUPPLIER" || user?.role === "STAFF";
  const showCart = !!user && !isInternal;
  const searchOpen = panel === "search";
  const menuOpen = panel === "menu";
  const accountOpen = panel === "account";
  const cartOpen = panel === "cart";

  const cartCount = useMemo(() => (showCart ? cartItems.reduce((sum, i) => sum + i.quantity, 0) : 0), [showCart, cartItems]);

  const toggle = useCallback((name: Exclude<Panel, null>) => setPanel((p) => (p === name ? null : name)), []);
  const closeAll = useCallback(() => setPanel(null), []);

  const scrollTo = useCallback(
    (id: string) => {
      closeAll();
      if (pathname === "/") document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      else router.push(`/#${id}`);
    },
    [pathname, router, closeAll],
  );

  useEffect(() => {
    closeAll();
  }, [pathname, closeAll]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
    if (!panel) return;

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAll();
    const onClick = (e: MouseEvent) => {
      if (accountOpen && !accountRef.current?.contains(e.target as Node)) closeAll();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [panel, searchOpen, accountOpen, closeAll]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/shop?search=${encodeURIComponent(q)}`);
    closeAll();
  }

  async function handleLogout() {
    closeAll();
    const ok = await logout();
    setCartItems([]);
    if (!ok) toast.error("Logout request failed");
    router.push("/");
    router.refresh();
  }

  const isActive = (item: NavEntry) => !!item.href && pathname.startsWith(item.href);
  const navProps = { onScroll: scrollTo, onNavigate: closeAll };

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0e0a09]/95 text-white backdrop-blur-md">
      <div className="mx-auto flex h-13 max-w-295 items-center justify-between px-4 sm:px-5 lg:px-8">
        <Link href="/" onClick={closeAll} className="text-[15px] font-black tracking-[-0.5px]">
          CHUNKN<span className="text-[#b9aaa0]">CHOP</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {!isInternal && NAV.map((item) => <NavItem key={item.label} item={item} className={navCls} active={isActive(item)} {...navProps} />)}

          {workspace && (
            <Link href={workspace.href} className={`${navCls} flex items-center gap-1.5 text-[#c9beb7]`}>
              <workspace.Icon size={14} />
              {workspace.label.toUpperCase()}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {!isInternal && (
            <button type="button" onClick={() => toggle("search")} aria-label={searchOpen ? "Close search" : "Open search"} className="text-[#c9beb7] transition hover:text-white">
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
          )}

          <div ref={accountRef} className="relative hidden items-center gap-2 sm:flex">
            {!isHydrated ? (
              <div className="h-8 w-20" aria-hidden="true" />
            ) : user ? (
              <>
                <button
                  type="button"
                  onClick={() => toggle("account")}
                  aria-label="Open account menu"
                  aria-expanded={accountOpen}
                  className="flex items-center gap-2 text-[#c9beb7] transition hover:text-white"
                >
                  <Avatar user={user} size="h-7 w-7 text-[11px]" />
                  <span className="hidden max-w-28 truncate text-xs font-semibold md:block">{firstName(user)}</span>
                </button>

                <div
                  className={`absolute top-full right-0 mt-3 w-52 origin-top-right border border-white/10 bg-[#16100e] shadow-xl transition-all duration-200 ${
                    accountOpen ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
                  }`}
                >
                  <div className="border-b border-white/10 px-4 py-2.5">
                    <p className="truncate text-[11px] text-[#9a8d84]">{user.email}</p>
                    <div className="mt-1">
                      <RoleBadge user={user} />
                    </div>
                  </div>

                  {workspace && (
                    <Link href={workspace.href} onClick={closeAll} className={dropCls}>
                      {workspace.label}
                    </Link>
                  )}
                  {!isInternal &&
                    ACCOUNT_LINKS.map((l) => (
                      <Link key={l.href} href={l.href} onClick={closeAll} className={dropCls}>
                        {l.label}
                      </Link>
                    ))}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-2 text-[13px] font-medium text-red-400 transition hover:bg-red-500/10"
                  >
                    <LogOut size={13} /> Logout
                  </button>
                </div>
              </>
            ) : (
              AUTH_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={l.desktop}>
                  {l.label}
                </Link>
              ))
            )}
          </div>

          {showCart && (
            <button
              type="button"
              onClick={() => toggle("cart")}
              aria-label={cartCount ? `Open cart, ${cartCount} items` : "Open cart, empty"}
              aria-expanded={cartOpen}
              className={`${btnCls} relative bg-brand hover:bg-[#aa1f1b]`}
            >
              <ShoppingBag size={16} className="sm:hidden" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-black sm:hidden">{cartCount}</span>
              )}
              <span className="hidden sm:inline">CART{cartCount > 0 && ` (${cartCount})`}</span>
            </button>
          )}

          <button type="button" onClick={() => toggle("menu")} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} className="relative h-5.5 w-5.5 md:hidden">
            <Menu size={22} className={`absolute inset-0 transition-all duration-300 ${menuOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"}`} />
            <X size={22} className={`absolute inset-0 transition-all duration-300 ${menuOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"}`} />
          </button>
        </div>
      </div>

      {!isInternal && (
        <div className={`grid transition-[grid-template-rows] duration-300 ${searchOpen ? "grid-rows-[1fr] border-t border-white/5" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <form onSubmit={handleSearch} className="mx-auto flex max-w-295 items-center gap-3 px-4 py-2.5 sm:px-5 lg:px-8">
              <Search size={16} className="text-[#7d6f66]" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search premium meat..."
                aria-label="Search products"
                tabIndex={searchOpen ? 0 : -1}
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#7d6f66]"
              />
            </form>
          </div>
        </div>
      )}

      {showCart && <CartDropdown isOpen={cartOpen} onClose={closeAll} />}

      <div
        aria-hidden={!menuOpen}
        className={`grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-in-out md:hidden ${
          menuOpen ? "visible grid-rows-[1fr] border-t border-white/5 opacity-100" : "invisible grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="max-h-[calc(100dvh-3.25rem)] overflow-y-auto overscroll-contain bg-[#0e0a09] px-4 py-5 sm:px-5">
            {user && (
              <div className={`mb-5 flex items-center gap-3 ${fade(menuOpen, 80).className}`} style={fade(menuOpen, 80).style}>
                <Avatar user={user} size="h-9 w-9 text-xs" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold">{user.name || firstName(user)}</p>
                  <p className="truncate text-[11px] text-[#9a8d84]">{user.email}</p>
                  <div className="mt-1">
                    <RoleBadge user={user} />
                  </div>
                </div>
              </div>
            )}

            {workspace && (
              <MobileSection title="Workspace" index={0} open={menuOpen}>
                <Link href={workspace.href} onClick={closeAll} className={`${mobileCls} text-[#c9beb7]`}>
                  {workspace.label.toUpperCase()}
                </Link>
              </MobileSection>
            )}

            {!isInternal && (
              <MobileSection title="Menu" index={1} open={menuOpen}>
                {NAV.map((item) => (
                  <NavItem key={item.label} item={item} className={mobileCls} active={isActive(item)} {...navProps} />
                ))}
              </MobileSection>
            )}

            {user && !isInternal && (
              <MobileSection title="Account" index={2} open={menuOpen}>
                {ACCOUNT_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} onClick={closeAll} className={`${mobileCls} text-[#c9beb7]`}>
                    {l.label}
                  </Link>
                ))}
              </MobileSection>
            )}

            {isHydrated && (
              <MobileSection index={3} open={menuOpen}>
                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-black tracking-wider text-red-400 transition hover:bg-red-500/20"
                  >
                    <LogOut size={14} /> LOGOUT
                  </button>
                ) : (
                  <div className="flex gap-2.5">
                    {AUTH_LINKS.map((l) => (
                      <Link key={l.href} href={l.href} onClick={closeAll} className={l.mobile}>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </MobileSection>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
