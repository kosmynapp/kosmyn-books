import { notFound } from 'next/navigation';
import { BookCard } from '@/components/books/book-card';
import { getBookPrograms } from '@/lib/api/books';

export const revalidate = 3600;

/**
 * Prebuild known tenant slugs (RESEARCH Q1 resolved 2026-04-21 via prod DB):
 * only 'kosmyn' (18 books) and 'languages' (5 books) currently publish.
 */
export async function generateStaticParams() {
  return [{ tenantSlug: 'kosmyn' }, { tenantSlug: 'languages' }];
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const allPrograms = await getBookPrograms();
  const filtered = allPrograms.filter((p) => p.tenantSlug === tenantSlug);

  if (filtered.length === 0) notFound();

  const tenantName = filtered[0]?.tenantName ?? tenantSlug;

  return (
    <main className="container mx-auto max-w-7xl px-md py-2xl">
      <header className="mb-xl">
        <h1 className="text-heading font-semibold">Biblioteca de {tenantName}</h1>
        <p className="mt-xs text-label text-text-secondary">
          <span className="numeric">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'livro publicado' : 'livros publicados'} pela comunidade {tenantName}.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-lg md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((program, i) => (
          <BookCard key={program.id} program={program} priority={i < 4} />
        ))}
      </div>
    </main>
  );
}
