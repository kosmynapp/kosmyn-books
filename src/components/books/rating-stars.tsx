'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { submitRating, getMyRating, removeRating } from '@/lib/api/ratings';

const STAR_COUNT = 5;

interface RatingStarsProps {
  programSlug: string;
  initialAvg: number | null | undefined;
  initialCount: number | undefined;
  /** display = read-only badge with avg+count; interactive = clickable stars */
  mode?: 'display' | 'interactive';
  compact?: boolean;
  /**
   * Tenant ID a usar no `X-Tenant-Id` ao chamar a API. Necessário em rotas
   * tenant-scoped (medicina, idiomas, …) — sem isso o cliente cai no default
   * (kosmyn) e o backend não acha o livro do tenant correto.
   */
  tenantId?: string;
}

function StarIcon({ filled, halfFill }: { filled: boolean; halfFill?: boolean }) {
  if (halfFill) {
    return (
      <span className="relative inline-block leading-none">
        <span className="text-text-tertiary">★</span>
        <span
          className="absolute inset-0 overflow-hidden text-amber-400"
          style={{ width: '50%' }}
        >
          ★
        </span>
      </span>
    );
  }
  return <span className={filled ? 'text-amber-400' : 'text-text-tertiary'}>★</span>;
}

export function RatingStars({
  programSlug,
  initialAvg,
  initialCount,
  mode = 'display',
  compact = false,
  tenantId,
}: RatingStarsProps) {
  const { user } = useAuth();
  const [avg, setAvg] = useState<number | null>(initialAvg ?? null);
  const [count, setCount] = useState<number>(initialCount ?? 0);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load my current rating once user is known
  useEffect(() => {
    if (mode !== 'interactive' || !user) return;
    const token = localStorage.getItem('kosmyn_token');
    if (!token) return;
    getMyRating(programSlug, token, tenantId)
      .then((r) => setMyRating(r.rating))
      .catch(() => {});
  }, [mode, user, programSlug, tenantId]);

  async function handleClick(value: number) {
    setError(null);
    if (!user) {
      window.location.href = `/login?redirect=/book/${programSlug}`;
      return;
    }
    const token = localStorage.getItem('kosmyn_token');
    if (!token) return;
    setBusy(true);
    try {
      // Toggle off when clicking the same star
      if (myRating === value) {
        const r = await removeRating(programSlug, token, tenantId);
        setMyRating(null);
        setAvg(r.programRatingAvg);
        setCount(r.programRatingCount);
      } else {
        const r = await submitRating(programSlug, value, token, tenantId);
        setMyRating(r.rating);
        setAvg(r.programRatingAvg);
        setCount(r.programRatingCount);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao avaliar';
      if (msg === 'EMAIL_VERIFICATION_REQUIRED') {
        setError('Verifique seu e-mail para avaliar.');
      } else if (msg === 'AUTH_REQUIRED') {
        setError('Faça login para avaliar.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  if (mode === 'display') {
    if (!count || count <= 0) return null;
    const filled = Math.round(avg ?? 0);
    return (
      <div
        className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'} text-text-secondary`}
      >
        <span aria-hidden>
          {Array.from({ length: STAR_COUNT }).map((_, i) => (
            <StarIcon key={i} filled={i < filled} />
          ))}
        </span>
        <span className="font-medium text-text-primary">
          {(avg ?? 0).toFixed(1)}
        </span>
        <span className="text-text-tertiary">({count})</span>
      </div>
    );
  }

  // Interactive
  const display = hovered ?? myRating ?? Math.round(avg ?? 0);
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-1.5"
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: STAR_COUNT }).map((_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              type="button"
              disabled={busy}
              onMouseEnter={() => setHovered(value)}
              onClick={() => handleClick(value)}
              className="text-3xl leading-none transition-transform hover:scale-110 disabled:opacity-50"
              aria-label={`Avaliar com ${value} estrela${value > 1 ? 's' : ''}`}
            >
              <StarIcon filled={value <= display} />
            </button>
          );
        })}
        {count > 0 && (
          <span className="ml-3 text-sm text-text-secondary">
            {(avg ?? 0).toFixed(1)} · {count} avaliações
          </span>
        )}
      </div>
      {!user && (
        <p className="text-xs text-text-tertiary">
          <Link href={`/login?redirect=/book/${programSlug}`} className="text-accent hover:underline">
            Faça login
          </Link>{' '}
          para avaliar este livro.
        </p>
      )}
      {myRating != null && !error && (
        <p className="text-xs text-text-tertiary">
          Sua avaliação: {myRating} estrela{myRating > 1 ? 's' : ''}. Clique de novo para remover.
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
