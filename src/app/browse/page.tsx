import { getBookPrograms } from '@/lib/api/books';
import { BrowseExplorer } from '@/components/books/browse-explorer';

export const revalidate = 3600;

export default async function BrowsePage() {
  const programs = await getBookPrograms();

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
      <BrowseExplorer programs={programs} />
    </main>
  );
}
