import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { BookCover } from '@/components/books/book-cover';
import { VersionBadge } from '@/components/books/version-badge';
import { DownloadButton } from '@/components/books/download-button';
import { ReadingMeasure } from '@/components/typography/reading-measure';
import { getBookByVersion } from '@/lib/api/books';

export const revalidate = 3600;

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; version: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Edição — Kosmyn Books`,
    alternates: {
      canonical: `https://books.kosmyn.com/book/${slug}`,
    },
  };
}

export default async function VersionedBookPage({
  params,
}: {
  params: Promise<{ slug: string; version: string }>;
}) {
  const { slug, version } = await params;

  if (!SEMVER_REGEX.test(version)) notFound();

  const data = await getBookByVersion(slug, version);
  if (!data) notFound();

  const { edition, currentVersion } = data;
  const isCurrent = edition.version === currentVersion;
  const isDeprecated = edition.status === 'DEPRECATED';

  return (
    <main className="container mx-auto max-w-7xl px-md py-2xl">
      {isDeprecated ? (
        <Alert variant="destructive" className="mb-xl">
          <AlertDescription>
            Esta edição foi descontinuada pelo editor.{' '}
            <Link href={`/book/${slug}`} className="underline underline-offset-2">
              Ver edição atual →
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        !isCurrent && (
          <Alert className="mb-xl border-l-4 border-l-accent bg-surface">
            <AlertDescription>
              Esta é uma edição anterior.{' '}
              <Link href={`/book/${slug}`} className="underline underline-offset-2 text-accent">
                Ver edição atual →
              </Link>
            </AlertDescription>
          </Alert>
        )
      )}

      <div className="grid gap-xl lg:grid-cols-5 lg:gap-2xl">
        <aside className="lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <BookCover coverUrl={data.coverUrl} alt={data.name} priority />
          </div>
        </aside>

        <div className="lg:col-span-3">
          <VersionBadge
            version={edition.version}
            status={edition.status}
            isCurrent={isCurrent}
          />
          <h1 className="mt-md text-heading font-semibold leading-[1.2] tracking-tight">
            {data.name}
          </h1>
          {data.author && (
            <p className="mt-sm text-label text-text-secondary">por {data.author}</p>
          )}
          {data.synopsis && (
            <div className="mt-lg">
              <ReadingMeasure>{data.synopsis}</ReadingMeasure>
            </div>
          )}

          <div className="mt-xl flex flex-wrap gap-md">
            <DownloadButton
              slug={slug}
              format="pdf"
              available={!!edition.pdfUrl}
              label={`Baixar PDF (v${edition.version})`}
              version={edition.version}
            />
            <DownloadButton
              slug={slug}
              format="epub"
              available={!!edition.epubUrl}
              label={`Baixar EPUB (v${edition.version})`}
              version={edition.version}
            />
          </div>

          {edition.changelog && (
            <>
              <Separator className="my-xl" />
              <section>
                <h2 className="mb-md text-heading font-semibold">Notas desta edição</h2>
                <ReadingMeasure>{edition.changelog}</ReadingMeasure>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
