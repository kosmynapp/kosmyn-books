/**
 * Typed client for /api/v1/books/* endpoints on kosmyn-service-platform.
 *
 * All fetchers use Next.js fetch cache with tags so revalidateTag() on webhook
 * pushes granular invalidation. Fail-closed to [] or null on any error.
 */

export type EditionStatus =
  | 'DRAFT'
  | 'PREVIEW'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'DEPRECATED';

export interface LibraryProgramEdition {
  id: string;
  version: string;
  status: EditionStatus;
  publishedAt: string | null;
  pdfUrl: string | null;
  epubUrl: string | null;
  ogImageUrl: string | null;
  changelog: string | null;
  pageCount: number | null;
  wordCount: number | null;
}

export interface LibraryProgram {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  synopsis: string | null;
  coverUrl: string | null;
  author: string | null;
  language: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  currentEdition: LibraryProgramEdition | null;
}

export interface LibraryProgramVersioned extends LibraryProgram {
  edition: LibraryProgramEdition;
  currentVersion: string;
}

import { SERVER_API_BASE } from '../server-api-base';

const API_BASE = SERVER_API_BASE;
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID ?? 'default';

/**
 * Fetch all programs with currentEdition populated.
 * Tags: ['books:all'] — revalidate on any publish event.
 */
export async function getBookPrograms(
  tenantId: string = DEFAULT_TENANT_ID,
): Promise<LibraryProgram[]> {
  try {
    const res = await fetch(
      `${API_BASE}/books/programs?tenantId=${encodeURIComponent(tenantId)}`,
      {
        next: { revalidate: 3600, tags: ['books:all', 'books:featured', 'books:browse'] },
      },
    );
    if (!res.ok) {
      console.error(`[books-api] getBookPrograms failed: ${res.status}`);
      return [];
    }
    const data = (await res.json()) as { programs: LibraryProgram[] };
    return data.programs.filter((p) => p.currentEdition?.status === 'PUBLISHED');
  } catch (err) {
    console.error('[books-api] getBookPrograms error:', err);
    return [];
  }
}

/**
 * Fetch a single program by slug (current edition).
 * Tags: [`book:${slug}`] — revalidate on publish event for this specific book.
 */
export async function getBookBySlug(slug: string): Promise<LibraryProgram | null> {
  try {
    const res = await fetch(
      `${API_BASE}/books/programs/${encodeURIComponent(slug)}`,
      {
        next: { revalidate: 3600, tags: [`book:${slug}`] },
        headers: { 'X-Tenant-Id': DEFAULT_TENANT_ID },
      },
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      console.error(`[books-api] getBookBySlug(${slug}) failed: ${res.status}`);
      return null;
    }
    return (await res.json()) as LibraryProgram;
  } catch (err) {
    console.error(`[books-api] getBookBySlug(${slug}) error:`, err);
    return null;
  }
}

/**
 * Fetch a specific versioned edition (Plan 28-04 adds the backing endpoint).
 * Tags: [`book:${slug}:v${version}`] — per-version invalidation.
 */
export async function getBookByVersion(
  slug: string,
  version: string,
): Promise<LibraryProgramVersioned | null> {
  try {
    const res = await fetch(
      `${API_BASE}/books/programs/${encodeURIComponent(slug)}/editions/${encodeURIComponent(
        version,
      )}`,
      {
        next: { revalidate: 3600, tags: [`book:${slug}:v${version}`] },
        headers: { 'X-Tenant-Id': DEFAULT_TENANT_ID },
      },
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      console.error(
        `[books-api] getBookByVersion(${slug}, ${version}) failed: ${res.status}`,
      );
      return null;
    }
    return (await res.json()) as LibraryProgramVersioned;
  } catch (err) {
    console.error(`[books-api] getBookByVersion error:`, err);
    return null;
  }
}
