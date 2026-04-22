// Milestone v1.4 Phase 30 — dynamic sitemap.xml
// Generates entries for:
// - Root + browse
// - Every book (canonical /book/[slug])
// - Taxonomy routes (/subject/*, /level/*, /exam/*, /career/*) — v1.5 Phase 37

import type { MetadataRoute } from 'next';
import { getBookPrograms } from '@/lib/api/books';
import { getTaxonomyFamily } from '@/lib/api/taxonomy';

const BASE_URL = 'https://books.kosmyn.com';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [books, subjects, levels, exams, careers] = await Promise.all([
    getBookPrograms().catch(() => []),
    getTaxonomyFamily('subject').catch(() => []),
    getTaxonomyFamily('level').catch(() => []),
    getTaxonomyFamily('exam').catch(() => []),
    getTaxonomyFamily('career').catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/browse`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Books — canonical URL (not versioned)
  const bookRoutes: MetadataRoute.Sitemap = books.map((b) => ({
    url: `${BASE_URL}/book/${b.slug}`,
    lastModified: b.currentEdition?.publishedAt ? new Date(b.currentEdition.publishedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Collections (per-tenant community page)
  const tenantSlugs = Array.from(new Set(books.map((b) => b.tenantSlug)));
  const collectionRoutes: MetadataRoute.Sitemap = tenantSlugs.map((slug) => ({
    url: `${BASE_URL}/collection/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Subject tree — top-level + any sub-path used via [...path]
  // For simplicity we emit one URL per subject slug joining its ancestor path.
  const subjectById = new Map(subjects.map((t) => [t.id, t]));
  const buildSubjectPath = (term: (typeof subjects)[number]): string[] => {
    const parts: string[] = [];
    let cursor: typeof term | undefined = term;
    while (cursor) {
      parts.unshift(cursor.slug);
      cursor = cursor.parentId ? subjectById.get(cursor.parentId) : undefined;
    }
    return parts;
  };
  const subjectRoutes: MetadataRoute.Sitemap = subjects.map((t) => ({
    url: `${BASE_URL}/subject/${buildSubjectPath(t).join('/')}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: t.depth === 0 ? 0.7 : 0.5,
  }));

  const levelRoutes: MetadataRoute.Sitemap = levels.map((t) => ({
    url: `${BASE_URL}/level/${t.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const examRoutes: MetadataRoute.Sitemap = exams.map((t) => ({
    url: `${BASE_URL}/exam/${t.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const careerRoutes: MetadataRoute.Sitemap = careers.map((t) => ({
    url: `${BASE_URL}/career/${t.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...bookRoutes,
    ...collectionRoutes,
    ...subjectRoutes,
    ...levelRoutes,
    ...examRoutes,
    ...careerRoutes,
  ];
}
