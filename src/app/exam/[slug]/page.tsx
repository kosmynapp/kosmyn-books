import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProgramsByFacets, getTaxonomyFamily, getPublicTaxonomyFamily } from '@/lib/api/taxonomy';
import { BookCard } from '@/components/books/book-card';
import { TaxonomySidebar } from '@/components/books/taxonomy-sidebar';

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

  const [exams, subjects, levels, careers, programs] = await Promise.all([
    getPublicTaxonomyFamily('exam'),
    getPublicTaxonomyFamily('subject'),
    getPublicTaxonomyFamily('level'),
    getPublicTaxonomyFamily('career'),
    getProgramsByFacets({ exam: slug }),
  ]);

  const term = exams.find((t) => t.slug === slug);
  if (!term) notFound();

  const hasBooks = (t: { programCount: number }) => t.programCount > 0;

  const topSubjects = subjects
    .filter((t) => t.depth === 0 && hasBooks(t))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const sidebarSections = [
    {
      title: 'Áreas de conhecimento',
      terms: topSubjects,
      hrefPrefix: '/subject',
    },
    {
      title: 'Por nível',
      terms: levels.filter(hasBooks),
      hrefPrefix: '/level',
    },
    {
      title: 'Outros preparatórios',
      terms: exams.filter((t) => t.slug !== slug && hasBooks(t)),
      hrefPrefix: '/exam',
      limit: 10,
    },
    {
      title: 'Por carreira',
      terms: careers.filter(hasBooks),
      hrefPrefix: '/career',
      limit: 8,
    },
  ];

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
        sections={sidebarSections}
        activeSlug={slug}
        emptyRecoveryHref={emptyRecovery}
        mobileOnly
      />

      <div className="flex gap-8">
        {/* Desktop cross-facet sidebar */}
        <TaxonomySidebar
          sections={sidebarSections}
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
