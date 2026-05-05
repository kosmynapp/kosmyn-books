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
  sizes = '(min-width: 1024px) 20vw, (min-width: 768px) 28vw, 60vw',
}: BookCoverProps) {
  return (
    <div
      className={cn(
        // max-w-xs (20rem/320px) caps the cover so the page detail doesn't
        // need to scroll on standard laptop heights. mx-auto keeps it centered
        // on mobile; lg:mx-0 left-aligns inside the sticky aside on desktop.
        'relative mx-auto aspect-[5/7] w-full max-w-xs overflow-hidden rounded-md bg-surface-light lg:mx-0',
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
          // object-contain preserva a arte completa — covers KOLM 2.5 incluem
          // selo "KOSMYN BOOKS" no rodapé que era cortado por object-cover
          // quando o aspect ratio do PNG não bate exatamente com 5/7.
          className="object-contain"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-text-tertiary">
          <BookOpen className="h-12 w-12" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
