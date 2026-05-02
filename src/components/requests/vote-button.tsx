'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { voteContentRequest, unvoteContentRequest } from '@/lib/api/content-requests';

interface VoteButtonProps {
  requestId: string;
  initialVoteCount: number;
  initialHasUserVoted: boolean;
  /** Disable interaction when the request is no longer accepting votes (e.g., declined/published). */
  disabled?: boolean;
}

export function VoteButton({
  requestId,
  initialVoteCount,
  initialHasUserVoted,
  disabled = false,
}: VoteButtonProps) {
  const { user } = useAuth();
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [hasVoted, setHasVoted] = useState(initialHasUserVoted);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setError(null);
    if (!user) {
      window.location.href = `/login?redirect=/sugestoes`;
      return;
    }
    const token = localStorage.getItem('kosmyn_token');
    if (!token) return;
    setBusy(true);
    try {
      if (hasVoted) {
        const result = await unvoteContentRequest(requestId, token);
        if ('error' in result) {
          setError(humanError(result.error));
        } else {
          setVoteCount(result.voteCount);
          setHasVoted(false);
        }
      } else {
        const result = await voteContentRequest(requestId, token);
        if ('error' in result) {
          setError(humanError(result.error));
        } else {
          setVoteCount(result.voteCount);
          setHasVoted(true);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy || disabled}
        onClick={toggle}
        aria-pressed={hasVoted}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all
          disabled:cursor-not-allowed disabled:opacity-50
          ${
            hasVoted
              ? 'border-amber-400 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
              : 'border-border bg-surface text-text-primary hover:border-amber-400/60 hover:bg-amber-400/5'
          }
        `}
      >
        <span aria-hidden>{hasVoted ? '✓' : '👍'}</span>
        <span>{voteCount}</span>
        <span className="hidden text-xs text-text-secondary sm:inline">
          {hasVoted ? 'Votado' : voteCount === 1 ? 'voto' : 'votos'}
        </span>
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

function humanError(code: string): string {
  switch (code) {
    case 'AUTH_REQUIRED':
      return 'Faça login para votar.';
    case 'EMAIL_VERIFICATION_REQUIRED':
      return 'Verifique seu e-mail para votar.';
    case 'RATE_LIMITED':
      return 'Muitos votos hoje, tente amanhã.';
    case 'NOT_FOUND':
      return 'Sugestão não encontrada.';
    default:
      return 'Falha ao registrar voto.';
  }
}
