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
import { getBookBySlug, getBookPrograms, getBookTaxonomyTerms } from '@/lib/api/books';

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
  const description = book.synopsis ?? book.description ?? undefined;
  // Phase 30 D-01 — og:image pre-rendered pelo worker Puppeteer (Phase 26) e
  // servida direto do R2 CDN (assets.kosmyn.com) em path versionado imutável.
  // Fallback estático /og-default.png (Plan 30-01) usado apenas em legacy
  // editions sem ogImageUrl populado — Plan 30-03 backfill populou todas em prod.
  // Decisão locked: CONTEXT.md D-01/D-02/D-03.
  const ogImageUrl =
    book.currentEdition?.ogImageUrl ??
    'https://books.kosmyn.com/og-default.png';
  return {
    title: `${book.name} — Kosmyn Books`,
    description,
    alternates: {
      canonical: `https://books.kosmyn.com/book/${slug}`,
    },
    openGraph: {
      title: book.name,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: book.name }],
      locale: 'pt_BR',
      type: 'book',
      url: `https://books.kosmyn.com/book/${slug}`,
      siteName: 'Kosmyn Books',
    },
    twitter: {
      card: 'summary_large_image',
      title: book.name,
      description,
      images: [ogImageUrl],
    },
    other: {
      'book:author': book.author ?? '',
      'book:release_date': book.currentEdition?.publishedAt ?? '',
    },
  };
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [book, taxonomy] = await Promise.all([
    getBookBySlug(slug),
    getBookTaxonomyTerms(slug),
  ]);
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

      {/* Phase 30 — JSON-LD Book (schema.org) + LearningResource (LRMI) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': ['Book', 'LearningResource'],
            '@id': `https://books.kosmyn.com/book/${book.slug}`,
            name: book.name,
            description: book.synopsis ?? book.description ?? undefined,
            url: `https://books.kosmyn.com/book/${book.slug}`,
            inLanguage: book.language ?? 'pt-BR',
            bookFormat: 'https://schema.org/EBook',
            image: book.coverUrl ?? undefined,
            author: book.author
              ? { '@type': 'Person', name: book.author }
              : undefined,
            publisher: {
              '@type': 'Organization',
              name: book.tenantName,
              url: `https://books.kosmyn.com/collection/${book.tenantSlug}`,
            },
            bookEdition: edition.version,
            datePublished: edition.publishedAt ?? undefined,
            numberOfPages: edition.pageCount ?? undefined,
            wordCount: edition.wordCount ?? undefined,
            isAccessibleForFree: true,
            potentialAction: [
              edition.pdfUrl
                ? {
                    '@type': 'ReadAction',
                    target: edition.pdfUrl,
                    name: 'Baixar PDF',
                  }
                : null,
              edition.epubUrl
                ? {
                    '@type': 'ReadAction',
                    target: edition.epubUrl,
                    name: 'Baixar EPUB',
                  }
                : null,
            ].filter(Boolean),
            // LRMI educational extensions
            learningResourceType: 'Book',
            educationalUse: 'Reading',
            // Phase 30 — taxonomy-derived LRMI fields (schema.org LearningResource)
            ...(taxonomy?.level
              ? {
                  educationalLevel: {
                    '@type': 'DefinedTerm',
                    name: taxonomy.level.min === taxonomy.level.max
                      ? taxonomy.level.min
                      : `${taxonomy.level.min}–${taxonomy.level.max}`,
                    inDefinedTermSet: 'https://books.kosmyn.com/taxonomy/level',
                  },
                }
              : {}),
            ...(taxonomy && (taxonomy.primarySubject || taxonomy.secondarySubjects.length > 0)
              ? {
                  teaches: [
                    ...(taxonomy.primarySubject
                      ? [
                          {
                            '@type': 'DefinedTerm',
                            name: taxonomy.primarySubject.label,
                            identifier: taxonomy.primarySubject.slug,
                            inDefinedTermSet: 'https://books.kosmyn.com/taxonomy/subject',
                          },
                        ]
                      : []),
                    ...taxonomy.secondarySubjects.map((s) => ({
                      '@type': 'DefinedTerm',
                      name: s.label,
                      identifier: s.slug,
                      inDefinedTermSet: 'https://books.kosmyn.com/taxonomy/subject',
                    })),
                  ],
                }
              : {}),
            ...(taxonomy && (taxonomy.primarySubject || taxonomy.careerTags.length > 0)
              ? {
                  about: [
                    ...(taxonomy.primarySubject
                      ? [
                          {
                            '@type': 'DefinedTerm',
                            name: taxonomy.primarySubject.label,
                            identifier: taxonomy.primarySubject.slug,
                          },
                        ]
                      : []),
                    ...taxonomy.careerTags.map((c) => ({
                      '@type': 'DefinedTerm',
                      name: c.label,
                      identifier: c.slug,
                      inDefinedTermSet: 'https://books.kosmyn.com/taxonomy/career',
                    })),
                  ],
                }
              : {}),
            ...(taxonomy?.examTags && taxonomy.examTags.length > 0
              ? {
                  assesses: taxonomy.examTags.map((e) => ({
                    '@type': 'DefinedTerm',
                    name: e.label,
                    identifier: e.slug,
                    inDefinedTermSet: 'https://books.kosmyn.com/taxonomy/exam',
                  })),
                }
              : {}),
          }),
        }}
      />

      {/* Phase 30 — Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Kosmyn Books',
                item: 'https://books.kosmyn.com/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Browse',
                item: 'https://books.kosmyn.com/browse',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: book.tenantName,
                item: `https://books.kosmyn.com/collection/${book.tenantSlug}`,
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: book.name,
              },
            ],
          }),
        }}
      />
    </main>
  );
}
