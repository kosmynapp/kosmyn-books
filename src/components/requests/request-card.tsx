'use client';

import Link from 'next/link';
import { type ContentRequest, statusLabel } from '@/lib/api/content-requests';
import { VoteButton } from './vote-button';

const STATUS_CLASSES: Record<ContentRequest['status'], string> = {
  pending_review: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  open: 'border-blue-400/40 bg-blue-400/10 text-blue-300',
  planned: 'border-violet-400/40 bg-violet-400/10 text-violet-300',
  in_production: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  published: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  declined: 'border-red-400/30 bg-red-400/5 text-red-300',
};

interface Props {
  request: ContentRequest;
}

export function RequestCard({ request }: Props) {
  const acceptingVotes = request.status === 'open' || request.status === 'planned';

  return (
    <article className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[request.status]}`}
            >
              {statusLabel(request.status)}
            </span>
            {request.suggestedSubjectSlug && (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-text-tertiary">
                {request.suggestedSubjectSlug}
              </span>
            )}
            {request.suggestedLevelSlug && (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-text-tertiary">
                {request.suggestedLevelSlug}
              </span>
            )}
            {request.isOwn && (
              <span className="rounded-full border border-amber-400/40 bg-amber-400/5 px-2 py-0.5 text-xs text-amber-300">
                Sua sugestão
              </span>
            )}
          </div>

          <h3 className="mt-3 text-lg font-semibold text-text-primary">
            {request.title}
          </h3>

          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-secondary">
            {request.description}
          </p>

          {request.statusReason && request.status !== 'open' && (
            <p className="mt-3 rounded border border-border bg-bg/50 px-3 py-2 text-xs text-text-secondary">
              <span className="font-medium text-text-primary">Nota da equipe:</span>{' '}
              {request.statusReason}
            </p>
          )}

          {request.fulfilledByProgram && (
            <Link
              href={`/book/${request.fulfilledByProgram.slug}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-300 hover:text-emerald-200"
            >
              <span aria-hidden>✓</span>
              <span>
                Publicado: <span className="font-medium">{request.fulfilledByProgram.name}</span>
              </span>
            </Link>
          )}

          <div className="mt-4 flex items-center gap-3 text-xs text-text-tertiary">
            <span>
              por{' '}
              <span className="text-text-secondary">
                {request.submitter.nickname || request.submitter.displayName || 'anônimo'}
              </span>
            </span>
            <span aria-hidden>·</span>
            <time dateTime={request.createdAt}>
              {formatRelative(request.createdAt)}
            </time>
          </div>
        </div>

        <VoteButton
          requestId={request.id}
          initialVoteCount={request.voteCount}
          initialHasUserVoted={request.hasUserVoted}
          disabled={!acceptingVotes}
        />
      </div>
    </article>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'agora';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min atrás`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h atrás`;
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)} d atrás`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
