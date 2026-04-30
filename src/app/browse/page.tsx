import { getPublicCrossTenantPrograms } from '@/lib/api/books';
import { BrowseExplorer } from '@/components/books/browse-explorer';
import { TaxonomySidebar } from '@/components/books/taxonomy-sidebar';
import { buildStandardSidebar } from '@/lib/sidebar';

export const revalidate = 3600;

export default async function BrowsePage() {
  // Phase 45 fix: switched from getBookPrograms() (single-tenant via DEFAULT_TENANT_ID)
  // to getPublicCrossTenantPrograms() so /browse surfaces ALL public tenants
  // (kosmyn + languages today; medicina/etc when admin opts them in).
  const [programs, { sections: sidebarSections }] = await Promise.all([
    getPublicCrossTenantPrograms(),
    buildStandardSidebar(),
  ]);

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
