import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Separator } from '@/components/ui/separator';
import { BookCover } from '@/components/books/book-cover';
import { VersionBadge } from '@/components/books/version-badge';
import { EditionHistoryList } from '@/components/books/edition-history';
import { DownloadButton } from '@/components/books/download-button';
import { ReadingMeasure } from '@/components/typography/reading-measure';
import { getBookBySlug, getBookPrograms } from '@/lib/api/books';

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const programs = await getBookPrograms();
    return programs.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return { title: 'Livro não encontrado — Kosmyn Books' };
  return {
    title: `${book.name} — Kosmyn Books`,
    description: book.synopsis ?? book.description ?? undefined,
    alternates: {
      canonical: `https://books.kosmyn.com/book/${slug}`,
    },
    openGraph: {
      title: book.name,
      description: book.synopsis ?? undefined,
      images: book.coverUrl ? [book.coverUrl] : undefined,
      locale: 'pt_BR',
      type: 'book',
    },
  };
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book || !book.currentEdition) notFound();

  const edition = book.currentEdition;

  return (
    <main className="container mx-auto max-w-7xl px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
        <aside className="lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <BookCover coverUrl={book.coverUrl} alt={book.name} priority />
          </div>
        </aside>

        <div className="lg:col-span-3">
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
