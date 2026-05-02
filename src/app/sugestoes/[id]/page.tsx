import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContentRequest } from '@/lib/api/content-requests';
import { RequestCard } from '@/components/requests/request-card';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SugestaoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const request = await getContentRequest(id).catch(() => null);
  if (!request) return notFound();

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/sugestoes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <span aria-hidden>←</span>
        Voltar para sugestões
      </Link>

      <RequestCard request={request} />
    </main>
  );
}
