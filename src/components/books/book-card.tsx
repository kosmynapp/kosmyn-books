import Link from 'next/link';
import { BookCover } from './book-cover';
import type { LibraryProgram } from '@/lib/api/books';

export interface BookCardProps {
  program: LibraryProgram;
  priority?: boolean;
}

export function BookCard({ program, priority }: BookCardProps) {
  return (
    <Link
      href={`/book/${program.slug}`}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <BookCover
        coverUrl={program.coverUrl}
        alt={program.name}
        priority={priority}
        className="transition-all duration-200 group-hover:scale-[1.02] group-hover:drop-shadow-[0_0_40px_rgba(139,92,246,0.35)]"
      />
      <div className="mt-sm space-y-xs">
        <h3 className="font-serif text-body font-semibold leading-tight text-text-primary">
          {program.name}
        </h3>
        {program.author && (
          <p className="text-label text-text-secondary">por {program.author}</p>
        )}
        {program.tenantName && (
          <p className="text-label text-text-tertiary">{program.tenantName}</p>
        )}
      </div>
    </Link>
  );
}
