export interface ComingSoonLandingProps {
  teaser: { books: number; communities: number };
}

export function ComingSoonLanding({ teaser }: ComingSoonLandingProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-md py-3xl">
      <div className="mx-auto max-w-[480px] text-center">
        <h1 className="text-display font-bold tracking-tight md:text-display">
          Kosmyn Books
        </h1>
        <p className="mt-md text-heading font-semibold text-text-primary">
          books.kosmyn.com, em breve.
        </p>
        <p className="mt-lg text-body leading-relaxed text-text-secondary">
          Estamos preparando a nova biblioteca da Kosmyn. Até lá, continue explorando os livros em{' '}
          <a href="https://kosmyn.com/books" className="underline underline-offset-2 hover:text-accent">
            kosmyn.com/books
          </a>
          .
        </p>
        {(teaser.books > 0 || teaser.communities > 0) && (
          <p className="mt-xl text-label text-text-tertiary">
            Já confirmados:{' '}
            <span className="numeric text-text-primary">{teaser.books}</span> livros de{' '}
            <span className="numeric text-text-primary">{teaser.communities}</span>{' '}
            {teaser.communities === 1 ? 'comunidade' : 'comunidades'}.
          </p>
        )}
      </div>
    </main>
  );
}
