"use client";

import { Fragment, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export type Crumb = {
  label: string;
  href?: string;
};

const LABELS: Record<string, string> = {
  shop: "Shop",
  categories: "Categories",
  meatbox: "Meatbox",
  orders: "Orders",
  account: "Account",
  subscriptions: "Subscriptions",
  wholesale: "Wholesale",
  support: "Support",
  auth: "Account",
  login: "Log In",
  signup: "Sign Up",
};

const humanize = (segment: string) =>
  decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function Breadcrumbs({ crumbs, className = "" }: { crumbs?: Crumb[]; className?: string }) {
  const pathname = usePathname();

  const items = useMemo<Crumb[]>(() => {
    if (crumbs) return crumbs;

    const segments = pathname.split("/").filter(Boolean);

    return segments.map((segment, i) => ({
      label: LABELS[segment] ?? humanize(segment),
      href: "/" + segments.slice(0, i + 1).join("/"),
    }));
  }, [crumbs, pathname]);

  const trail: Crumb[] = [{ label: "Home", href: "/" }, ...items.filter((crumb) => !(crumb.label.toLowerCase() === "home" && crumb.href === "/"))];

  if (trail.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-bold tracking-[0.14em] uppercase">
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1;

          return (
            <Fragment key={`${crumb.label}-${crumb.href ?? "current"}-${i}`}>
              <li>
                {isLast || !crumb.href ? (
                  <span aria-current={isLast ? "page" : undefined} className="text-white">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="text-white/60 transition hover:text-white">
                    {crumb.label}
                  </Link>
                )}
              </li>

              {!isLast && (
                <li aria-hidden="true" className="flex items-center text-white/30">
                  <ChevronRight size={12} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
