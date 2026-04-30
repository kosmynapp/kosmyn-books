import { getPublicCrossTenantPrograms } from '@/lib/api/books';
import { getPublicTaxonomyFamily } from '@/lib/api/taxonomy';
import { BrowseExplorer } from '@/components/books/browse-explorer';
import { TaxonomySidebar } from '@/components/books/taxonomy-sidebar';

export const revalidate = 3600;

export default async function BrowsePage() {
  // Phase 45 fix: switched from getBookPrograms() (single-tenant via DEFAULT_TENANT_ID)
  // to getPublicCrossTenantPrograms() so /browse surfaces ALL public tenants
  // (kosmyn + languages today; medicina/etc when admin opts them in).
  // Taxonomy via public-library endpoint — only terms with programCount > 0 surface.
  const [programs, subjects, levels, exams, careers, formats, audiences] =
    await Promise.all([
      getPublicCrossTenantPrograms(),
      getPublicTaxonomyFamily('subject'),
      getPublicTaxonomyFamily('level'),
      getPublicTaxonomyFamily('exam'),
      getPublicTaxonomyFamily('career'),
      getPublicTaxonomyFamily('format'),
      getPublicTaxonomyFamily('audience'),
    ]);

  const hasBooks = (t: { programCount: number }) => t.programCount > 0;

  // Top-level subjects only (depth=0), filtered to those with books
  const topDomains = subjects
    .filter((t) => t.depth === 0 && hasBooks(t))
    .sort((a, b) => a.sortOrder - b.sortOrder);

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

  const sidebarSections = [
    {
      title: 'Áreas de conhecimento',
      terms: topDomains,
      hrefPrefix: '/subject',
      hierarchical: false as const,
    },
    {
      title: 'Por nível',
      terms: levels.filter(hasBooks),
      hrefPrefix: '/level',
    },
    {
      title: 'Preparatórios para exames',
      terms: exams.filter(hasBooks),
      hrefPrefix: '/exam',
      limit: 12,
    },
    {
      title: 'Por carreira',
      terms: careers.filter(hasBooks),
      hrefPrefix: '/career',
      limit: 10,
    },
    {
      title: 'Por formato',
      terms: formats.filter(hasBooks),
      hrefPrefix: '/browse/format',
    },
    {
      title: 'Por audiência',
      terms: audiences.filter(hasBooks),
      hrefPrefix: '/browse/audience',
    },
  ];

  return (
    <main className="container mx-auto max-w-7xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Todos os livros</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {programs.length}{' '}
          {programs.length === 1 ? 'livro disponível' : 'livros disponíveis'}
        </p>
      </header>

      {/* Mobile filter strip (TaxonomySidebar renders lg:hidden internally) */}
      <TaxonomySidebar sections={sidebarSections} mobileOnly />

      {/* Desktop: sidebar + content */}
      <div className="flex gap-8">
        <TaxonomySidebar sections={sidebarSections} desktopOnly />
        <div className="min-w-0 flex-1">
          <BrowseExplorer programs={programs} />
        </div>
      </div>
    </main>
  );
}
