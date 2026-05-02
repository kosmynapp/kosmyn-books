import Link from 'next/link';
import { BookCover } from './book-cover';
import { RatingStars } from './rating-stars';
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
      <div className="mt-2 space-y-1">
        <h3 className="text-base font-semibold leading-tight text-text-primary">
          {program.name}
        </h3>
        {program.author && (
          <p className="text-sm text-text-secondary">por {program.author}</p>
        )}
        {program.tenantName && (
          <p className="text-sm text-text-tertiary">{program.tenantName}</p>
        )}
        <RatingStars
          programSlug={program.slug}
          initialAvg={program.ratingAvg}
          initialCount={program.ratingCount}
          mode="display"
          compact
        />
      </div>
    </Link>
  );
}
