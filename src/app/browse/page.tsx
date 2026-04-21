import { getBookPrograms } from '@/lib/api/books';
import { BrowseExplorer } from '@/components/books/browse-explorer';

export const revalidate = 3600;

export default async function BrowsePage() {
  const programs = await getBookPrograms();

  if (programs.length === 0) {
    return (
      <main className="container mx-auto max-w-7xl px-md py-2xl">
        <header className="mb-xl">
          <h1 className="text-heading font-bold">Todos os livros</h1>
        </header>
        <div className="py-4xl text-center">
          <h2 className="text-heading font-semibold text-text-primary">
            Ainda não há livros publicados.
          </h2>
          <p className="mt-md text-body text-text-secondary">
            Quando as comunidades publicarem novas edições, elas aparecerão aqui. Volte em breve.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-7xl px-md py-2xl">
      <BrowseExplorer programs={programs} />
    </main>
  );
}
