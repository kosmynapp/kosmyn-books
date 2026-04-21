import { getBookPrograms } from '@/lib/api/books';
import { BookCard } from '@/components/books/book-card';

export const revalidate = 3600;

export default async function BrowsePage() {
  const programs = await getBookPrograms();

  return (
    <main className="container mx-auto max-w-7xl px-md py-2xl">
      <header className="mb-xl">
        <h1 className="font-serif text-heading font-semibold">Todos os livros</h1>
        <p className="mt-xs text-label text-text-secondary">
          <span className="numeric">{programs.length}</span>{' '}
          {programs.length === 1 ? 'livro disponível' : 'livros disponíveis'}
        </p>
      </header>

      {programs.length === 0 ? (
        <div className="py-4xl text-center">
          <h2 className="font-serif text-heading font-semibold text-text-primary">
            Ainda não há livros publicados.
          </h2>
          <p className="mt-md text-body text-text-secondary">
            Quando as comunidades publicarem novas edições, elas aparecerão aqui. Volte em breve.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-lg md:grid-cols-3 lg:grid-cols-4">
          {programs.map((program, i) => (
            <BookCard key={program.id} program={program} priority={i < 4} />
          ))}
        </div>
      )}
    </main>
  );
}
