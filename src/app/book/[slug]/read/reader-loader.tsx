'use client';
/**
 * Phase 31 Plan 02 — client-only loader for ReaderClient (D-11).
 *
 * Next.js 16 forbids `ssr: false` dynamic imports inside Server Components,
 * so this thin client wrapper hosts the dynamic import. The page.tsx server
 * component fetches metadata and renders <ReaderLoader> with the props.
 */
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// ssr:false — react-pdf cannot render server-side (DOMMatrix, OffscreenCanvas).
const ReaderClient = dynamic(
  () => import('@/components/reader/reader-client').then((m) => m.ReaderClient),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Skeleton className="w-[800px] h-[1100px]" />
      </div>
    ),
  },
);

export interface ReaderLoaderProps {
  slug: string;
  bookName: string;
  version: string;
  pageCount: number | null;
  buildId?: string;
}

export function ReaderLoader(props: ReaderLoaderProps) {
  return <ReaderClient {...props} />;
}
