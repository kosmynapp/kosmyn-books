/**
 * Typed client for /api/v1/books/taxonomy/* endpoints.
 * Milestone v1.5 — faceted discovery on books.kosmyn.com.
 */

import { SERVER_API_BASE } from '../server-api-base';
import type { LibraryProgram } from './books';

export type TaxonomyFamily =
  | 'subject'
  | 'level'
  | 'audience'
  | 'goal'
  | 'exam'
  | 'career'
  | 'competency'
  | 'format'
  | 'series';

export interface TaxonomyTerm {
  id: string;
  family: TaxonomyFamily;
  slug: string;
  label: string;
  description: string | null;
  parentId: string | null;
  depth: number;
  sortOrder: number;
  code: string | null;
  iconEmoji: string | null;
  color: string | null;
}

export async function getTaxonomyFamily(
  family: TaxonomyFamily,
): Promise<TaxonomyTerm[]> {
  try {
    const res = await fetch(`${SERVER_API_BASE}/books/taxonomy/${family}`, {
      next: { revalidate: 3600, tags: [`taxonomy:${family}`] },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { terms: TaxonomyTerm[] };
    return data.terms;
  } catch {
    return [];
  }
}

export async function getSubjectNode(slug: string): Promise<{
  term: TaxonomyTerm;
  children: TaxonomyTerm[];
} | null> {
  try {
    const res = await fetch(
      `${SERVER_API_BASE}/books/taxonomy/subject/path/${encodeURIComponent(slug)}`,
      { next: { revalidate: 3600, tags: [`taxonomy:subject:${slug}`] } },
    );
    if (!res.ok) return null;
    return (await res.json()) as { term: TaxonomyTerm; children: TaxonomyTerm[] };
  } catch {
    return null;
  }
}

export interface FacetQuery {
  subject?: string;
  level?: string;
  audience?: string;
  goal?: string;
  exam?: string;
  career?: string;
  format?: string;
  series?: string;
  universe?: string;
  q?: string;
  tenantId?: string;
  language?: string;
}

export async function getProgramsByFacets(
  filters: FacetQuery = {},
): Promise<LibraryProgram[]> {
  const qs = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '') as Array<[string, string]>,
  ).toString();
  const url = `${SERVER_API_BASE}/books/programs${qs ? `?${qs}` : ''}`;
  try {
    const tagParts = Object.entries(filters)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}:${v}`);
    const tag = `books:facet:${tagParts.join('|')}`;
    const res = await fetch(url, {
      next: { revalidate: 600, tags: ['books:all', tag] },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { programs: LibraryProgram[] };
    return data.programs.filter((p) => p.currentEdition?.status === 'PUBLISHED');
  } catch {
    return [];
  }
}
