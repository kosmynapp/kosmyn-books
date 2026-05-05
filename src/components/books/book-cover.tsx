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
        // max-w-[20rem] (320px) caps the cover so detail page doesn't scroll.
        // mx-auto centra mobile, lg:mx-0 left-align em desktop.
        // IMPORTANTE: usar valor arbitrário em vez de max-w-xs — memória
        // feedback_tokens_preset_broken_classes registra que @kosmynapp/tokens
        // preset quebra classes nomeadas como max-w-{xs,md,lg,xl} no kosmyn-*.
        'relative mx-auto aspect-[5/7] w-full max-w-[20rem] overflow-hidden rounded-md bg-surface-light lg:mx-0',
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
