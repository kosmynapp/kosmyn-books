import Link from 'next/link';
import { getBookPrograms } from '@/lib/api/books';
import { getTaxonomyFamily } from '@/lib/api/taxonomy';
import { BrowseExplorer } from '@/components/books/browse-explorer';

export const revalidate = 3600;

export default async function BrowsePage() {
  const [programs, subjects, levels, exams] = await Promise.all([
    getBookPrograms(),
    getTaxonomyFamily('subject'),
    getTaxonomyFamily('level'),
    getTaxonomyFamily('exam'),
  ]);

  // Top-level subjects only (depth=0)
  const topDomains = subjects.filter((t) => t.depth === 0).sort((a, b) => a.sortOrder - b.sortOrder);

  if (programs.length === 0) {
    return (
      <main className="container mx-auto max-w-7xl px-4 py-12">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Todos os livros</h1>
        </header>
        <div className="py-24 text-center">
          <h2 className="text-2xl font-semibold text-text-primary">
            Ainda não há livros publicados.
          </h2>
          <p className="mt-4 text-base text-text-secondary">
            Quando as comunidades publicarem novas edições, elas aparecerão aqui. Volte em breve.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl px-4 py-12">
      {/* Navegação por facetas (Milestone v1.5) */}
      {topDomains.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary mb-3">
            Áreas de conhecimento
          </h2>
          <div className="flex flex-wrap gap-2">
            {topDomains.map((t) => (
              <Link
                key={t.slug}
                href={`/subject/${t.slug}`}
                className="px-3 py-1.5 rounded-full text-sm bg-surface hover:bg-muted transition flex items-center gap-1.5"
              >
                {t.iconEmoji && <span>{t.iconEmoji}</span>}
                <span>{t.label}</span>
                {t.code && <span className="text-xs opacity-60 font-mono">{t.code}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {(levels.length > 0 || exams.length > 0) && (
        <section className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {levels.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary mb-3">
                Por nível
              </h2>
              <div className="flex flex-wrap gap-2">
                {levels.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/level/${t.slug}`}
                    className="px-3 py-1.5 rounded-full text-sm bg-surface hover:bg-muted transition"
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {exams.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary mb-3">
                Preparatórios
              </h2>
              <div className="flex flex-wrap gap-2">
                {exams.slice(0, 8).map((t) => (
                  <Link
                    key={t.slug}
                    href={`/exam/${t.slug}`}
                    className="px-3 py-1.5 rounded-full text-sm bg-surface hover:bg-muted transition"
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <BrowseExplorer programs={programs} />
    </main>
  );
}
