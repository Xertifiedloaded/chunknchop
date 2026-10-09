"use client";

import { useEffect, useState } from "react";

export interface Category {
  name: string;
  slug: string;
}

let cache: Category[] | null = null;
let inflight: Promise<Category[]> | null = null;

function loadCategories(): Promise<Category[]> {
  if (cache) return Promise.resolve(cache);

  inflight ??= fetch("/api/categories")
    .then(async (res) => {
      if (!res.ok) throw new Error("Failed to load categories");
      const data: Category[] = await res.json();
      cache = data.map(({ name, slug }) => ({ name, slug }));
      return cache;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let cancelled = false;

    loadCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch((err) => console.error("Failed to load categories:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading };
}