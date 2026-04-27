import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BookOpenText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookCover } from '@/components/books/book-cover';
import { VersionBadge } from '@/components/books/version-badge';
import { EditionHistoryList } from '@/components/books/edition-history';
import { DownloadButton } from '@/components/books/download-button';
import { ReadingMeasure } from '@/components/typography/reading-measure';
import { getPublicCrossTenantPrograms } from '@/lib/api/books';

/**
 * Phase 45 D-13 — Tenant-scoped book permalink.
 *
 * Indexable canonical when 2+ tenants share a slug; also rendered for unique
 * slugs so the URL form is stable for SEO regardless of catalog churn.
 *
 * Cache: SSR fetch via getPublicCrossTenantPrograms() uses `cache: 'no-store'`
 * (D-10). CDN edge handles 5min TTL (Cache-Control from upstream, D-7). Admin
 * /api/revalidate hook (Plan 45-04) busts the edge on flag flip.
 */

interface PageProps {
  params: Promise<{ tenantSlug: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantSlug, slug } = await params;
  const all = await getPublicCrossTenantPrograms();
  const book = all.find((p) => p.tenantSlug === tenantSlug && p.slug === slug);
  if (!book) return { title: 'Livro não encontrado — Kosmyn Books' };

  const description = book.synopsis ?? book.description ?? undefined;
  const ogImageUrl =
    book.currentEdition?.ogImageUrl ??
    'https://books.kosmyn.com/og-default.png';

  return {
    title: `${book.name} — ${book.tenantName} — Kosmyn Books`,
    description,
    alternates: {
      canonical: `https://books.kosmyn.com/${tenantSlug}/book/${slug}`,
    },
    // Phase 45 D-13: tenant-scoped permalink is indexable. The canonical
    // /book/[slug] form 302s here when 2+ tenants share a slug, so search
    // engines should index this URL as the stable disambiguated form.
    robots: { index: true, follow: true },
    openGraph: {
      title: book.name,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: book.name }],
      locale: 'pt_BR',
      type: 'book',
      url: `https://books.kosmyn.com/${tenantSlug}/book/${slug}`,
      siteName: 'Kosmyn Books',
    },
    twitter: {
      card: 'summary_large_image',
      title: book.name,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function TenantBookPage({ params }: PageProps) {
  const { tenantSlug, slug } = await params;
  const all = await getPublicCrossTenantPrograms();
  const book = all.find((p) => p.tenantSlug === tenantSlug && p.slug === slug);
  if (!book || !book.currentEdition) notFound();

  const edition = book.currentEdition;

  return (
    <main className="container mx-auto max-w-7xl px-4 py-12">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-sm text-text-secondary"
      >
        <Link href="/browse" className="hover:underline">
          Catálogo
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={`/collection/${tenantSlug}`} className="hover:underline">
          {book.tenantName}
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{book.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
        <aside className="lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <BookCover coverUrl={book.coverUrl} alt={book.name} priority />
          </div>
        </aside>

        <div className="lg:col-span-3">
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            {book.tenantName}
          </p>
          <VersionBadge
            version={edition.version}
            status={edition.status}
            isCurrent
          />
          <h1 className="mt-4 text-2xl font-semibold leading-[1.2] tracking-tight">
            {book.name}
          </h1>
          {book.author && (
            <p className="mt-2 text-sm text-text-secondary">por {book.author}</p>
          )}
          {book.synopsis && (
            <div className="mt-6">
              <ReadingMeasure>{book.synopsis}</ReadingMeasure>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            {edition.pdfUrl && (
              <Button asChild size="lg" variant="default">
                <Link href={`/book/${book.slug}/read`}>
                  <BookOpenText className="h-4 w-4" />
                  Ler online
                </Link>
              </Button>
            )}
            <DownloadButton
              slug={book.slug}
              format="pdf"
              available={!!edition.pdfUrl}
              label="Baixar PDF"
            />
            <DownloadButton
              slug={book.slug}
              format="epub"
              available={!!edition.epubUrl}
              label="Baixar EPUB"
            />
          </div>

          {edition.changelog && (
            <>
              <Separator className="my-8" />
              <section>
                <h2 className="mb-4 text-2xl font-semibold">Notas desta edição</h2>
                <ReadingMeasure>{edition.changelog}</ReadingMeasure>
              </section>
            </>
          )}

          <Separator className="my-8" />
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Histórico de edições</h2>
            <EditionHistoryList
              slug={book.slug}
              editions={[edition]}
              currentVersion={edition.version}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
