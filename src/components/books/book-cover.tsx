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
        // max-w-[22rem] (352px) — bumped from 20rem para ficar mais presente
        // sem entrar em scroll. Wrapper externo aceita overflow visível para
        // o glow ambiente vazar; o ::before atrás da capa cria o halo.
        // mx-auto centra mobile, lg:mx-0 left-align em desktop.
        // IMPORTANTE: usar valor arbitrário em vez de max-w-xs — memória
        // feedback_tokens_preset_broken_classes registra que @kosmynapp/tokens
        // preset quebra classes nomeadas como max-w-{xs,md,lg,xl} no kosmyn-*.
        'relative mx-auto aspect-[5/7] w-full max-w-[22rem] lg:mx-0',
        // Glow ambiente atrás da capa (gradient roxo→azul típico Kosmyn).
        // before:scale-95 + blur cria a luz vazando das bordas; pulse anima
        // sutilmente. -z-10 mantém o halo atrás da capa.
        'before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[2rem]',
        'before:bg-gradient-to-br before:from-violet-500/40 before:via-purple-500/30 before:to-indigo-500/40',
        'before:blur-3xl before:opacity-80',
        className,
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-md bg-surface-light shadow-[0_25px_60px_-15px_rgba(139,92,246,0.45)] ring-1 ring-white/5 transition-transform duration-500 hover:scale-[1.02]">
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
    </div>
  );
}
