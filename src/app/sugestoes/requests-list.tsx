'use client';

import Link from 'next/link';
import { type ContentRequest } from '@/lib/api/content-requests';
import { RequestCard } from '@/components/requests/request-card';

interface Props {
  initialRequests: ContentRequest[];
}

export function RequestsList({ initialRequests }: Props) {
  if (initialRequests.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-surface/50 p-12 text-center">
        <p className="text-base text-text-primary">Nenhuma sugestão ainda.</p>
        <p className="mt-2 text-sm text-text-secondary">
          Seja o primeiro a sugerir um livro.
        </p>
        <Link
          href="/sugestoes/nova"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-bg hover:bg-amber-300"
        >
          Sugerir conteúdo
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {initialRequests.map((req) => (
        <RequestCard key={req.id} request={req} />
      ))}
    </section>
  );
}
