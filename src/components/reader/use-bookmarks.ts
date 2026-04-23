'use client';
/**
 * Phase 31 Plan 02 — localStorage bookmarks hook (D-08).
 *
 * Key format: `kosmyn:reader:${slug}:v${editionVersion}:bookmarks`
 * Editions are immutable per Phase 25 BE-01, so version-keyed marks never
 * point at stale page numbers across republishes.
 */
import { useCallback, useEffect, useState } from 'react';

const storageKey = (slug: string, version: string) =>
  `kosmyn:reader:${slug}:v${version}:bookmarks`;

export function useBookmarks(slug: string, version: string) {
  const [bookmarks, setBookmarks] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(storageKey(slug, version));
    if (!raw) {
      setBookmarks([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((n) => typeof n === 'number')) {
        setBookmarks(parsed as number[]);
      }
    } catch {
      // Corrupted localStorage — reset.
      setBookmarks([]);
    }
  }, [slug, version]);

  const toggle = useCallback(
    (page: number) => {
      setBookmarks((prev) => {
        const next = prev.includes(page)
          ? prev.filter((p) => p !== page)
          : [...prev, page].sort((a, b) => a - b);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(storageKey(slug, version), JSON.stringify(next));
        }
        return next;
      });
    },
    [slug, version],
  );

  return { bookmarks, toggle };
}
