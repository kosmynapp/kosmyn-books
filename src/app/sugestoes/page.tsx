import Link from 'next/link';
import { Suspense } from 'react';
import { listContentRequests, type ContentRequestStatus } from '@/lib/api/content-requests';
import { RequestsList } from './requests-list';
import { MyPendingSuggestions } from './my-pending';

export const dynamic = 'force-dynamic';

const TABS: Array<{
  key: 'top' | 'new' | 'published';
  label: string;
  status: ContentRequestStatus | 'all';
  sort: 'top' | 'new';
}> = [
  { key: 'top', label: 'Mais votadas', status: 'all', sort: 'top' },
  { key: 'new', label: 'Recentes', status: 'all', sort: 'new' },
  { key: 'published', label: 'Publicadas', status: 'published', sort: 'new' },
];

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SugestoesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeTab = TABS.find((t) => t.key === params.tab) ?? TABS[0];

  const result = await listContentRequests({
    status: activeTab.status,
    sort: activeTab.sort,
    limit: 50,
  }).catch(() => ({ requests: [], total: 0 }));

  return (
    <main className="container mx-auto max-w-[56rem] px-4 py-12">
      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              Sugestões da comunidade
            </h1>
            <p className="mt-2 max-w-[42rem] text-base text-text-secondary">
              Sugira livros, vote nos que mais quer ver publicados. As mais votadas viram prioridade no roadmap.
            </p>
          </div>
          <Link
            href="/sugestoes/nova"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition-colors hover:bg-amber-300"
          >
            <span aria-hidden>＋</span>
            Sugerir conteúdo
          </Link>
        </div>
      </header>

      <nav className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab.key;
          return (
            <Link
              key={tab.key}
              href={tab.key === 'top' ? '/sugestoes' : `/sugestoes?tab=${tab.key}`}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-amber-400"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <MyPendingSuggestions />

      <Suspense fallback={<div className="py-12 text-center text-text-secondary">Carregando…</div>}>
        <RequestsList initialRequests={result.requests} />
      </Suspense>
    </main>
  );
}
