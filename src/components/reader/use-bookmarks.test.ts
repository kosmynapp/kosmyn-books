/**
 * Phase 31 Plan 02 — useBookmarks unit tests (RDR-03).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBookmarks } from './use-bookmarks';

const SLUG = 'mitologia-grega';
const V = '1.0.0';
const KEY = `kosmyn:reader:${SLUG}:v${V}:bookmarks`;

describe('useBookmarks (Phase 31 RDR-03)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns empty bookmarks when localStorage is empty', () => {
    const { result } = renderHook(() => useBookmarks(SLUG, V));
    expect(result.current.bookmarks).toEqual([]);
  });

  it('toggle(5) writes [5] to localStorage under expected key', () => {
    const { result } = renderHook(() => useBookmarks(SLUG, V));
    act(() => {
      result.current.toggle(5);
    });
    expect(result.current.bookmarks).toEqual([5]);
    expect(window.localStorage.getItem(KEY)).toBe('[5]');
  });

  it('toggle(5) then toggle(3) returns sorted [3,5]', () => {
    const { result } = renderHook(() => useBookmarks(SLUG, V));
    act(() => {
      result.current.toggle(5);
      result.current.toggle(3);
    });
    expect(result.current.bookmarks).toEqual([3, 5]);
  });

  it('toggle(5) twice removes the bookmark (toggle off)', () => {
    const { result } = renderHook(() => useBookmarks(SLUG, V));
    act(() => {
      result.current.toggle(5);
      result.current.toggle(5);
    });
    expect(result.current.bookmarks).toEqual([]);
    expect(window.localStorage.getItem(KEY)).toBe('[]');
  });

  it('reads existing localStorage on mount', () => {
    window.localStorage.setItem(KEY, '[7,11,42]');
    const { result } = renderHook(() => useBookmarks(SLUG, V));
    expect(result.current.bookmarks).toEqual([7, 11, 42]);
  });

  it('changing version changes the key (D-08 — bookmarks per edition version)', () => {
    window.localStorage.setItem(KEY, '[1,2,3]');
    const { result } = renderHook(() => useBookmarks(SLUG, '2.0.0'));
    // v2.0.0 has no marks even though v1.0.0 does
    expect(result.current.bookmarks).toEqual([]);
  });
});
