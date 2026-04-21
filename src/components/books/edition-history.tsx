import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { LibraryProgramEdition } from '@/lib/api/books';

export interface EditionHistoryListProps {
  slug: string;
  editions: LibraryProgramEdition[];
  currentVersion: string;
}

/**
 * Timeline of all versions for a program.
 * Phase 28 ships with single-edition variant (callers pass [currentEdition]).
 * Full history fetch via /programs/:slug/editions endpoint deferred to Phase 29+.
 */
export function EditionHistoryList({
  slug,
  editions,
  currentVersion,
}: EditionHistoryListProps) {
  if (editions.length === 0) {
    return (
      <p className="text-label text-text-tertiary">Nenhuma edição disponível.</p>
    );
  }

  return (
    <ul className="space-y-sm">
      {editions.map((edition) => {
        const isCurrent = edition.version === currentVersion;
        const href = isCurrent ? `/book/${slug}` : `/book/${slug}/v${edition.version}`;
        return (
          <li key={edition.id} className="flex items-center gap-md">
            <Link
              href={href}
              className="text-body text-accent-secondary hover:underline underline-offset-2 numeric"
            >
              v{edition.version}
            </Link>
            <Badge variant="outline" className="text-label">
              {edition.status}
            </Badge>
            {edition.publishedAt && (
              <span className="text-label text-text-tertiary numeric">
                {new Date(edition.publishedAt).toLocaleDateString('pt-BR')}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
