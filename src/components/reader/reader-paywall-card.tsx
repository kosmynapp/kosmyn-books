'use client';
/**
 * Phase 31 Plan 02 — paywall card shown at page 21+ for anon users (D-06).
 *
 * Replaces the canvas entirely (NOT an overlay above page 20) — picked over
 * overlay because it removes ambiguity ("is the canvas still loading or
 * locked?") and gives the login CTA full visual real estate.
 */
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface ReaderPaywallCardProps {
  slug: string;
  pagesShown: number;
  totalPages: number;
  onResetToFirstPage: () => void;
}

export function ReaderPaywallCard({
  slug,
  pagesShown,
  totalPages,
  onResetToFirstPage,
}: ReaderPaywallCardProps) {
  const redirect = `/book/${slug}/read`;
  // max-w-[28rem] (arbitrary value) instead of `max-w-md` because
  // @kosmynapp/tokens/tailwind-preset.css overrides .max-w-md to
  // `max-width: var(--k-space-md)` (16px = spacing token), collapsing
  // the card to 16px wide. The @theme inline override in globals.css does
  // NOT win because the preset emits a hard-coded rule, not @theme-driven.
  // Until the shared preset is fixed, all `max-w-{md,lg,xl,2xl}` and `w-{56,64}`
  // Tailwind classes are unsafe in this repo — use arbitrary values explicitly.
  return (
    <Card className="mx-auto w-full max-w-[28rem] p-8 text-center">
      <Lock className="mx-auto h-10 w-10 text-text-secondary" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold">
        Você leu as primeiras {pagesShown} páginas. Faça login para continuar.
      </h2>
      {totalPages > 0 && (
        <p className="mt-2 text-sm text-text-secondary">
          {pagesShown} de {totalPages} páginas exibidas no modo de pré-visualização.
        </p>
      )}
      <div className="mt-6 flex flex-col gap-3">
        <Button asChild size="lg">
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`}>
            Fazer login para ler completo
          </Link>
        </Button>
        <Button variant="outline" size="lg" onClick={onResetToFirstPage}>
          Voltar à página 1
        </Button>
      </div>
    </Card>
  );
}
