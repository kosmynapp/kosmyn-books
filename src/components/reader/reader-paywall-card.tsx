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
  return (
    <Card className="mx-auto w-full max-w-md p-8 text-center">
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
