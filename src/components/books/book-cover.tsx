import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BookCoverProps {
  coverUrl: string | null;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

export function BookCover({
  coverUrl,
  alt,
  priority = false,
  className,
  sizes = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw',
}: BookCoverProps) {
  return (
    <div
      className={cn(
        'relative aspect-[5/7] w-full overflow-hidden rounded-md bg-surface-light',
        className,
      )}
    >
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-text-tertiary">
          <BookOpen className="h-12 w-12" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
