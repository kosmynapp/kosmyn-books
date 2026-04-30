/**
 * Shared sidebar builder — 4 fixed sections used by every browse page
 * (browse, subject, level, exam, career). Keeps navigation consistent so
 * the user always has the same scaffolding on screen.
 */

import { getPublicTaxonomyFamily, type TaxonomyTermWithCount } from '@/lib/api/taxonomy';
import type { SidebarSection } from '@/components/books/taxonomy-sidebar';

const hasBooks = (t: { programCount: number }) => t.programCount > 0;

export interface StandardSidebar {
  sections: SidebarSection[];
  /** All subject terms (with counts) — useful for resolving top-domain in /subject pages and child filtering. */
  subjects: TaxonomyTermWithCount[];
}

export async function buildStandardSidebar(): Promise<StandardSidebar> {
  const [subjects, levels, exams, careers] = await Promise.all([
    getPublicTaxonomyFamily('subject'),
    getPublicTaxonomyFamily('level'),
    getPublicTaxonomyFamily('exam'),
    getPublicTaxonomyFamily('career'),
  ]);

  const topDomains = subjects
    .filter((t) => t.depth === 0 && hasBooks(t))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const sections: SidebarSection[] = [
    {
      title: 'Áreas de conhecimento',
      terms: topDomains,
      hrefPrefix: '/subject',
    },
    {
      title: 'Por nível',
      terms: levels.filter(hasBooks),
      hrefPrefix: '/level',
    },
    {
      title: 'Preparatórios para exames',
      terms: exams.filter(hasBooks),
      hrefPrefix: '/exam',
      limit: 12,
    },
    {
      title: 'Por carreira',
      terms: careers.filter(hasBooks),
      hrefPrefix: '/career',
      limit: 10,
    },
  ];

  return { sections, subjects };
}

/**
 * Walk a subject term up to its top-domain (depth=0).
 * Used so /subject/exatas/matematica highlights "Ciências Exatas" in the sidebar,
 * regardless of how deep the path goes.
 */
export function resolveSubjectTopDomain(
  slug: string,
  subjects: TaxonomyTermWithCount[],
): string | undefined {
  const byId = new Map(subjects.map((s) => [s.id, s]));
  let term = subjects.find((s) => s.slug === slug);
  while (term && term.depth > 0 && term.parentId) {
    term = byId.get(term.parentId);
  }
  return term?.slug;
}
