'use client';
/**
 * Phase 31 Plan 02 — reader toolbar (D-09).
 *
 * Layout (desktop): [Prev] [Página X de N | jump-to] [Next] | [ZoomOut] [%] [ZoomIn] | [Bookmark] [Fullscreen]
 * Layout (mobile):   [Prev][X/N][input][Next][ZoomOut][ZoomIn][Bookmark][Fullscreen]
 *                    (icons compacted + zoom% hidden + separators hidden to fit 1 row)
 *
 * Theme: reader is dark-only per product call (2026-04-23) — matches site theme.
 */
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Bookmark,
  BookmarkPlus,
  BookmarkMinus,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2.0;
export const ZOOM_STEP = 0.1;

export interface ReaderToolbarProps {
  bookName: string;
  version: string;
  currentPage: number;
  numPages: number;
  /**
   * D-06: highest page that the toolbar Next button / jump-to input may target.
   * For auth users this equals numPages. For anon users it equals SAMPLE_LIMIT+1
   * when the PDF has more than SAMPLE_LIMIT pages (one-step beyond the cap so the
   * paywall card can be revealed by clicking Next at page 20). Defaults to numPages.
   */
  maxPage?: number;
  zoom: number;
  /** RDR-03 bookmarks — full list for navigation dropdown (D-08 localStorage-backed). */
  bookmarks: number[];
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** Toggle bookmark on the currently displayed page. */
  onBookmarkToggle: () => void;
  /** Optional fullscreen toggle. When omitted, the button is not rendered. */
  onToggleFullscreen?: () => void;
}

export function ReaderToolbar(props: ReaderToolbarProps) {
  const {
    currentPage,
    numPages,
    maxPage,
    zoom,
    bookmarks,
    onPageChange,
    onZoomIn,
    onZoomOut,
    onBookmarkToggle,
    onToggleFullscreen,
  } = props;

  // D-06: effectiveMax is the upper bound for nav controls; numPages stays as
  // the indicator denominator so the user always sees "Página X de <real-total>".
  const effectiveMax = maxPage ?? numPages;
  const bookmarked = bookmarks.includes(currentPage);
  const bookmarkCount = bookmarks.length;

  // Track fullscreen state for icon swap (Maximize2 ↔ Minimize2).
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const doc = document as Document & { webkitFullscreenElement?: Element };
    const onChange = () =>
      setIsFullscreen(!!(doc.fullscreenElement ?? doc.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const onJumpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    if (Number.isNaN(raw)) return;
    const clamped = Math.max(1, Math.min(effectiveMax || 1, raw));
    onPageChange(clamped);
  };

  return (
    <div className="sticky top-0 z-10 flex items-center gap-0.5 border-b border-border bg-background/80 px-1 py-2 backdrop-blur sm:gap-3 sm:px-4 sm:py-3">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Página anterior"
        disabled={currentPage <= 1 || numPages === 0}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="size-8 sm:size-9"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      <div className="flex items-center gap-1 text-xs sm:gap-2 sm:text-sm">
        <span aria-live="polite" className="whitespace-nowrap">
          <span className="hidden sm:inline">
            Página {currentPage} de {numPages || '—'}
          </span>
          <span className="sm:hidden">
            {currentPage}/{numPages || '—'}
          </span>
        </span>
        <Input
          type="number"
          min={1}
          max={effectiveMax || 1}
          value={currentPage}
          onChange={onJumpChange}
          aria-label="Pular para página"
          className="h-8 w-11 px-1 sm:w-16 sm:px-3"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Próxima página"
        disabled={currentPage >= effectiveMax || effectiveMax === 0}
        onClick={() => onPageChange(Math.min(effectiveMax || currentPage, currentPage + 1))}
        className="size-8 sm:size-9"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Separator orientation="vertical" className="hidden h-6 sm:block" />
      <Button
        variant="ghost"
        size="icon"
        aria-label="Diminuir zoom"
        disabled={zoom <= ZOOM_MIN}
        onClick={onZoomOut}
        className="size-8 sm:size-9"
      >
        <ZoomOut className="h-4 w-4" aria-hidden="true" />
      </Button>
      <span className="hidden w-12 text-center font-mono text-xs sm:inline">
        {Math.round(zoom * 100)}%
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Aumentar zoom"
        disabled={zoom >= ZOOM_MAX}
        onClick={onZoomIn}
        className="size-8 sm:size-9"
      >
        <ZoomIn className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Separator orientation="vertical" className="hidden h-6 sm:block" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={bookmarked ? 'default' : 'ghost'}
            size="icon"
            aria-label={
              bookmarkCount === 0
                ? 'Marcadores (vazio)'
                : `Marcadores (${bookmarkCount})`
            }
            aria-pressed={bookmarked}
            className="relative size-8 sm:size-9"
          >
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            {bookmarkCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
                aria-hidden="true"
              >
                {bookmarkCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[14rem] border-zinc-800 bg-zinc-900 text-zinc-100 shadow-xl"
        >
          <DropdownMenuLabel>Marcadores</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onBookmarkToggle} className="gap-2">
            {bookmarked ? (
              <>
                <BookmarkMinus className="h-4 w-4" aria-hidden="true" />
                Remover marcador da página {currentPage}
              </>
            ) : (
              <>
                <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
                Marcar página {currentPage}
              </>
            )}
          </DropdownMenuItem>
          {bookmarkCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-text-secondary">
                Ir para marcador
              </DropdownMenuLabel>
              {bookmarks.map((page) => (
                <DropdownMenuItem
                  key={page}
                  onSelect={() => onPageChange(page)}
                  className="gap-2"
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                  Página {page}
                  {page === currentPage && (
                    <span className="ml-auto text-xs text-text-secondary">atual</span>
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}
          {bookmarkCount === 0 && (
            <DropdownMenuItem disabled className="text-xs">
              Nenhum marcador salvo ainda
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {onToggleFullscreen && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={isFullscreen ? 'Sair do modo tela cheia' : 'Modo tela cheia'}
          aria-pressed={isFullscreen}
          onClick={onToggleFullscreen}
          className="size-8 sm:size-9"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      )}
    </div>
  );
}
