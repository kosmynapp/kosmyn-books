'use client';
/**
 * Phase 31 Plan 02 — Main reader 'use client' component (RDR-01/02/03).
 *
 * Decisions implemented:
 *   D-02 client-side page-render limit (Option B — no schema change)
 *   D-03 same-origin proxy via /api/sample/[slug]
 *   D-04 module-level workerSrc setup via ./pdf-worker-config import
 *   D-05 single /read route, sample = anon, full = auth, same component
 *   D-06 paywall card replacement at page 21+ for anon users
 *   D-07 dark wrapper, light canvas (acceptable trade-off A5)
 *   D-08 bookmarks via useBookmarks(slug, version)
 *   D-09 toolbar with page indicator + jump-to + zoom + dark + bookmark
 *   D-12 (revised post Wave 0): API ALWAYS returns pageCount=null. Trust runtime
 *        numPages from Document.onLoadSuccess. Defensive paywall only fires when
 *        BOTH the prop AND runtime value are unknown — i.e., the PDF failed to
 *        load (and even then the <Document loading={Skeleton}> handles it).
 *   D-14 pdfjs options: isEvalSupported:false, disableAutoFetch:true, verbosity:0
 *   D-15 vi.mock react-pdf + next/dynamic for unit tests (see *.test.tsx)
 */
import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { ReaderToolbar, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '@/components/reader/reader-toolbar';
import { ReaderPaywallCard } from '@/components/reader/reader-paywall-card';
import { useBookmarks } from '@/components/reader/use-bookmarks';
import { useKeyboardNav } from '@/components/reader/use-keyboard-nav';
import { Skeleton } from '@/components/ui/skeleton';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import '@/lib/reader/pdf-worker-config';

const Document = dynamic(
  () => import('react-pdf').then((m) => m.Document),
  { ssr: false, loading: () => <Skeleton className="w-[800px] h-[1100px]" /> },
);
const Page = dynamic(
  () => import('react-pdf').then((m) => m.Page),
  { ssr: false },
);

const SAMPLE_LIMIT = 20; // D-02
const BASE_WIDTH = 800;

// D-14 — passed to <Document options=...> to disable PDF JavaScript
// (XSS hardening) and aggressive prefetch (memory hardening for mobile).
// disableRange + disableStream forced TRUE: upstream /books/download
// returns HTTP 200 even when Range is sent, which breaks pdfjs streaming
// ("expected 206, got 200"). Until upstream gains Range support, the
// proxy serves the full PDF in one shot and pdfjs parses it locally.
const PDF_OPTIONS = Object.freeze({
  isEvalSupported: false,
  disableAutoFetch: true,
  disableStream: true,
  disableRange: true,
  verbosity: 0,
});

export interface ReaderClientProps {
  slug: string;
  bookName: string;
  version: string;
  pageCount: number | null;
}

export function ReaderClient({ slug, bookName, version, pageCount }: ReaderClientProps) {
  const { user, loading: authLoading } = useAuth();
  const [numPages, setNumPages] = useState<number>(pageCount ?? 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [dark, setDark] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { bookmarks, toggle } = useBookmarks(slug, version);

  const isAnon = !authLoading && !user;
  // D-12 (revised post Wave 0 audit): API hardcodes pageCount=null. Trust runtime
  // numPages from Document.onLoadSuccess. Defensive paywall only fires when BOTH
  // the prop AND runtime value are unknown — i.e., the PDF failed to load.
  const reliablePageCount = pageCount ?? numPages ?? 0;
  const hasMoreThanSample = reliablePageCount > SAMPLE_LIMIT;

  // D-02 + D-12: anon caps at 20 readable pages; if pageCount is null treat as 0.
  const maxAccessiblePage = useMemo(() => {
    if (user) return numPages;
    const known = numPages || reliablePageCount;
    return Math.min(SAMPLE_LIMIT, known);
  }, [user, numPages, reliablePageCount]);

  // D-06: anon may navigate one step beyond the cap (to SAMPLE_LIMIT + 1) so
  // the paywall card is reachable from the toolbar Next button / keyboard
  // ArrowRight at page 20. Auth users navigate freely up to numPages.
  const maxNavigablePage = useMemo(() => {
    if (user) return numPages;
    if (hasMoreThanSample) return SAMPLE_LIMIT + 1;
    return maxAccessiblePage;
  }, [user, hasMoreThanSample, numPages, maxAccessiblePage]);

  // D-06: replace canvas with paywall when anon user crosses sample limit.
  // D-12 (revised post Wave 0): API ALWAYS returns pageCount=null. The defensive
  // "paywall on reliablePageCount===0" branch was dropped — it would block 100%
  // of anon sample-preview access on first paint (numPages=0 until onLoadSuccess).
  // Document's <Skeleton loading=...> covers the loading state; loadError
  // covers the failure state. Paywall is purely the "you finished the sample"
  // signal now.
  const showPaywall = isAnon && currentPage > SAMPLE_LIMIT;

  // D-03: same-origin proxy for both anon AND auth (one path keeps the reader simple).
  const fileUrl = `/api/sample/${encodeURIComponent(slug)}`;

  const onPrev = useCallback(
    () => setCurrentPage((p) => Math.max(1, p - 1)),
    [],
  );
  const onNext = useCallback(
    () => setCurrentPage((p) => Math.min(maxNavigablePage, p + 1)),
    [maxNavigablePage],
  );
  const onZoomIn = useCallback(
    () => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 10) / 10)),
    [],
  );
  const onZoomOut = useCallback(
    () => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 10) / 10)),
    [],
  );
  const onToggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {
        /* swallow — UX-only */
      });
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useKeyboardNav({
    onNext,
    onPrev,
    onZoomIn,
    onZoomOut,
    onToggleFullscreen,
  });

  return (
    <div
      data-testid="reader-wrapper"
      className={
        dark
          ? 'min-h-screen bg-zinc-950 text-zinc-100'
          : 'min-h-screen bg-zinc-100 text-zinc-900'
      }
    >
      <ReaderToolbar
        bookName={bookName}
        version={version}
        currentPage={currentPage}
        numPages={numPages}
        maxPage={maxNavigablePage}
        zoom={zoom}
        dark={dark}
        bookmarked={bookmarks.includes(currentPage)}
        onPageChange={(p) => setCurrentPage(Math.max(1, Math.min(maxNavigablePage || p, p)))}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onDarkToggle={() => setDark((d) => !d)}
        onBookmark={() => toggle(currentPage)}
      />

      <main className="mx-auto max-w-5xl px-4 py-8 flex justify-center">
        {loadError ? (
          <div className="text-center text-sm text-text-secondary">
            {loadError}
          </div>
        ) : showPaywall ? (
          <ReaderPaywallCard
            slug={slug}
            pagesShown={SAMPLE_LIMIT}
            totalPages={numPages || pageCount || 0}
            onResetToFirstPage={() => setCurrentPage(1)}
          />
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages: n }: { numPages: number }) => setNumPages(n)}
            onLoadError={() => setLoadError('Não foi possível carregar o PDF. Tente recarregar a página.')}
            options={PDF_OPTIONS}
            loading={<Skeleton className="w-[800px] h-[1100px]" />}
          >
            <Page pageNumber={currentPage} width={BASE_WIDTH * zoom} />
          </Document>
        )}
      </main>
    </div>
  );
}
