'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/books/book-card';
import type { LibraryProgram } from '@/lib/api/books';

interface BrowseExplorerProps {
  programs: LibraryProgram[];
}

export function BrowseExplorer({ programs }: BrowseExplorerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return programs;
    return programs.filter((p) => {
      const haystack = [
        p.name,
        p.author ?? '',
        p.synopsis ?? '',
        p.description ?? '',
        p.tenantName ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [programs, query]);

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Todos os livros
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            <span className="numeric">{filtered.length}</span>{' '}
            {filtered.length === 1 ? 'livro encontrado' : 'livros encontrados'}
            {query.length > 0 && filtered.length !== programs.length && (
              <span className="text-text-tertiary">
                {' '}(de {programs.length})
              </span>
            )}
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, autor ou sinopse"
            aria-label="Buscar livros"
            className="h-11 pl-9 pr-9"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <h2 className="text-xl font-semibold text-text-primary">
            Nenhum livro encontrado.
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Tente outra busca.
          </p>
          {query.length > 0 && (
            <div className="mt-6">
              <Button variant="outline" onClick={() => setQuery('')}>
                Limpar busca
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8">
          {filtered.map((program, i) => (
            <BookCard key={program.id} program={program} priority={i < 4} />
          ))}
        </div>
      )}
    </>
  );
}
