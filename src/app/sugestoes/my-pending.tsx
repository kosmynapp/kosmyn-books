'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  listContentRequests,
  statusLabel,
  type ContentRequest,
} from '@/lib/api/content-requests';

/**
 * Renders the current user's submissions that are still in moderation
 * (status=pending_review) or were declined. Hidden when the user is
 * anonymous or has no pending/declined items.
 */
export function MyPendingSuggestions() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<ContentRequest[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    const token = localStorage.getItem('kosmyn_token');
    if (!token) return;
    Promise.all([
      listContentRequests({ status: 'pending_review', limit: 20 }, token),
      listContentRequests({ status: 'declined', limit: 20 }, token),
    ])
      .then(([pending, declined]) => {
        const mine = [...pending.requests, ...declined.requests].filter((r) => r.isOwn);
        setItems(mine);
      })
      .catch(() => {})
      .finally(() => setFetched(true));
  }, [loading, user]);

  if (!user || !fetched || items.length === 0) return null;

  return (
    <section className="mb-8 rounded-xl border border-amber-400/30 bg-amber-400/5 p-5">
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-amber-300">
          Suas sugestões em revisão
        </h2>
        <p className="mt-1 text-xs text-text-secondary">
          Sugestões passam por curadoria antes de aparecer publicamente. Você verá uma nota aqui se uma for recusada.
        </p>
      </header>
      <ul className="flex flex-col gap-2">
        {items.map((r) => (
          <li
            key={r.id}
            className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{r.title}</p>
              {r.statusReason && (
                <p className="mt-1 text-xs text-text-secondary">
                  <span className="text-text-tertiary">Nota: </span>{r.statusReason}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                r.status === 'declined'
                  ? 'border-red-400/40 bg-red-400/10 text-red-300'
                  : 'border-amber-400/40 bg-amber-400/10 text-amber-300'
              }`}
            >
              {statusLabel(r.status)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
