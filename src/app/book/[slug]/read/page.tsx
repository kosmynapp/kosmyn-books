/**
 * Phase 31 Plan 02 — RSC shell for the reader (D-10, D-11).
 *
 * Server-fetches edition metadata so the page can:
 *   1. Emit `<meta name="robots" content="noindex,nofollow">` for D-10
 *   2. Set canonical → /book/[slug] (Phase 30 SEO continuity)
 *   3. Hand pageCount + version to the client reader (avoids client refetch)
 *
 * The actual reader is dynamic-imported with ssr:false inside ReaderLoader
 * (a 'use client' wrapper) because Next.js 16 forbids ssr:false dynamic
 * imports inside Server Components.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBookBySlug } from '@/lib/api/books';
import { ReaderLoader } from './reader-loader';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  return {
    title: book ? `Ler: ${book.name} — Kosmyn Books` : 'Leitor — Kosmyn Books',
    // D-10: reader is a tool, not indexable content. Canonical points back
    // at the canonical book page so any inbound link consolidates rank there.
    robots: { index: false, follow: false },
    alternates: {
      canonical: `https://books.kosmyn.com/book/${slug}`,
    },
  };
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book?.currentEdition?.pdfUrl) notFound();

  const edition = book.currentEdition;
  return (
    <ReaderLoader
      slug={book.slug}
      bookName={book.name}
      version={edition.version}
      pageCount={edition.pageCount}
    />
  );
}
