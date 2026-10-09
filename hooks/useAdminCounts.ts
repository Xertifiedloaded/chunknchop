"use client";

import { useEffect, useState } from "react";

export type AdminCounts = Partial<Record<string, number>>;

export function useAdminCounts(intervalMs = 60_000) {
  const [counts, setCounts] = useState<AdminCounts>({});

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/counts", { credentials: "include", cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (active) setCounts(data);
      } catch {
      }
    }

    load();
    const id = setInterval(load, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return counts;
}