"use client";

import { useEffect, useState } from "react";
import type { ContentTypeKey } from "./config";

export type PublicEntry = {
  id: string;
  type: ContentTypeKey;
  title: string;
  slug: string | null;
  sortOrder: number;
  data: Record<string, any>;
  publishedAt: string | null;
};
type Result = Partial<Record<ContentTypeKey, PublicEntry[]>>;

const TTL_MS = 30_000;
const cache = new Map<string, { at: number; p: Promise<Result> }>();

function load(key: string): Promise<Result> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.p;

  const p = fetch(`/api/content?type=${key}`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("content fetch failed"))))
    .then((j) => (j.content ?? {}) as Result)
    .catch(() => {
      cache.delete(key);
      return {} as Result;
    });

  cache.set(key, { at: Date.now(), p });
  return p;
}

export function useCmsContent(types: ContentTypeKey[]) {
  const key = [...types].sort().join(",");
  const [data, setData] = useState<Result>({});
  const [loading, setLoading] = useState(!!key);

  useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    let off = false;
    load(key).then((r) => {
      if (!off) {
        setData(r);
        setLoading(false);
      }
    });
    return () => {
      off = true;
    };
  }, [key]);

  return { data, loading };
}