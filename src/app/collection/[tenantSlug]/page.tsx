import { notFound } from 'next/navigation';
import { BookCard } from '@/components/books/book-card';
import { getPublicCrossTenantPrograms } from '@/lib/api/books';

export const revalidate = 3600;

/**
 * Phase 45: collection routes prebuilt for known public tenants. Add new
 * slugs here when admin opts them in via Tenant.publicLibrary.
 */
export async function generateStaticParams() {
  return [{ tenantSlug: 'kosmyn' }, { tenantSlug: 'languages' }, { tenantSlug: 'medicina' }];
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  // Phase 45 fix: switched from getBookPrograms() (single-tenant default)
  // to getPublicCrossTenantPrograms() so collection pages render any public
  // tenant's catalog, not only kosmyn's.
  const allPrograms = await getPublicCrossTenantPrograms();
  const filtered = allPrograms.filter((p) => p.tenantSlug === tenantSlug);

  if (filtered.length === 0) notFound();

  const tenantName = filtered[0]?.tenantName ?? tenantSlug;

  return (
    <main className="container mx-auto max-w-7xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Biblioteca de {tenantName}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          <span className="numeric">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'livro publicado' : 'livros publicados'} pela comunidade {tenantName}.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((program, i) => (
          <BookCard key={program.id} program={program} priority={i < 4} />
        ))}
      </div>
    </main>
  );
}
