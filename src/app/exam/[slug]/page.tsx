import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProgramsByFacets, getTaxonomyFamily } from '@/lib/api/taxonomy';
import { BookCard } from '@/components/books/book-card';
import { TaxonomySidebar } from '@/components/books/taxonomy-sidebar';
import { buildStandardSidebar } from '@/lib/sidebar';

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const terms = await getTaxonomyFamily('exam');
  return terms.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const terms = await getTaxonomyFamily('exam');
  const term = terms.find((t) => t.slug === slug);
  return {
    title: term ? `Preparatório ${term.label} · Kosmyn Books` : 'Prova · Kosmyn Books',
    description: term?.description ?? `Livros preparatórios para ${slug}.`,
  };
}

export default async function ExamPage({ params }: Props) {
  const { slug } = await params;

  const [{ sections }, programs] = await Promise.all([
    buildStandardSidebar(),
    getProgramsByFacets({ exam: slug }),
  ]);

  const examSection = sections.find((s) => s.hrefPrefix === '/exam');
  const term = examSection?.terms.find((t) => t.slug === slug);
  if (!term) notFound();

  const emptyRecovery = programs.length === 0 ? '/browse' : undefined;

  return (
    <main className="container mx-auto max-w-7xl px-4 py-12">
      <nav className="text-sm text-text-secondary mb-4">
        <Link href="/browse" className="hover:underline">Browse</Link>
        {' / '}
        <span className="text-text-primary">{term.label}</span>
      </nav>

      <header className="mb-8">
        <p className="text-sm text-text-secondary uppercase tracking-wide mb-1">Preparatório</p>
        <h1 className="text-3xl font-bold">{term.label}</h1>
        {term.description && <p className="mt-2 text-text-secondary">{term.description}</p>}
      </header>

      {/* Mobile filter strip */}
      <TaxonomySidebar
        sections={sections}
        activeSlug={slug}
        emptyRecoveryHref={emptyRecovery}
        mobileOnly
      />

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <TaxonomySidebar
          sections={sections}
          activeSlug={slug}
          emptyRecoveryHref={emptyRecovery}
          desktopOnly
        />

        <div className="min-w-0 flex-1">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary mb-3">
              {programs.length} {programs.length === 1 ? 'livro' : 'livros'}
            </h2>
            {programs.length === 0 ? (
              <p className="text-text-secondary py-12 text-center">
                Ainda não há livros públicos para esta prova.{' '}
                <Link href="/browse" className="text-primary hover:underline">
                  Ver todos os livros
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {programs.map((p) => (
                  <BookCard key={p.id} program={p} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
