'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/books/book-card';
import { cn } from '@/lib/utils';
import type { LibraryProgram } from '@/lib/api/books';

interface BrowseExplorerProps {
  programs: LibraryProgram[];
}

interface TenantOption {
  slug: string;
  name: string;
  count: number;
}

export function BrowseExplorer({ programs }: BrowseExplorerProps) {
  const [query, setQuery] = useState('');
  const [tenant, setTenant] = useState<string>('all');

  const tenantOptions: TenantOption[] = useMemo(() => {
    const buckets = new Map<string, TenantOption>();
    for (const p of programs) {
      if (!p.tenantSlug) continue;
      const existing = buckets.get(p.tenantSlug);
      if (existing) {
        existing.count += 1;
      } else {
        buckets.set(p.tenantSlug, {
          slug: p.tenantSlug,
          name: p.tenantName || p.tenantSlug,
          count: 1,
        });
      }
    }
    return Array.from(buckets.values()).sort((a, b) => b.count - a.count);
  }, [programs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return programs.filter((p) => {
      if (tenant !== 'all' && p.tenantSlug !== tenant) return false;
      if (q.length === 0) return true;
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
  }, [programs, query, tenant]);

  const clearFilters = () => {
    setQuery('');
    setTenant('all');
  };

  const filtersActive = query.length > 0 || tenant !== 'all';

  return (
    <>
      <header className="mb-xl">
        <h1 className="text-heading font-bold">Todos os livros</h1>
        <p className="mt-xs text-label text-text-secondary">
          <span className="numeric">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'livro encontrado' : 'livros encontrados'}
          {filtersActive && programs.length !== filtered.length && (
            <>
              {' '}
              <span className="text-text-tertiary">
                (de {programs.length})
              </span>
            </>
          )}
        </p>
      </header>

      <div className="mb-xl flex flex-col gap-md md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, autor ou sinopse"
            aria-label="Buscar livros"
            className="pl-9"
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

        {tenantOptions.length > 1 && (
          <div className="flex flex-wrap gap-xs">
            <FilterPill
              active={tenant === 'all'}
              onClick={() => setTenant('all')}
              label={`Todos (${programs.length})`}
            />
            {tenantOptions.map((opt) => (
              <FilterPill
                key={opt.slug}
                active={tenant === opt.slug}
                onClick={() => setTenant(opt.slug)}
                label={`${opt.name} (${opt.count})`}
              />
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-4xl text-center">
          <h2 className="text-heading font-semibold text-text-primary">
            Nenhum livro encontrado.
          </h2>
          <p className="mt-md text-body text-text-secondary">
            Ajuste a busca ou limpe os filtros.
          </p>
          {filtersActive && (
            <div className="mt-xl">
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-lg md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((program, i) => (
            <BookCard key={program.id} program={program} priority={i < 4} />
          ))}
        </div>
      )}
    </>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-md py-xs text-label transition-colors',
        active
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-border text-text-secondary hover:border-text-secondary hover:text-text-primary',
      )}
    >
      {label}
    </button>
  );
}
