'use client';
/**
 * Phase 31 Plan 02 — reader toolbar (D-09).
 *
 * Layout: [Prev] [Página X de N | jump-to-input] [Next] | [Zoom-out] [zoom%] [Zoom-in] | [Bookmark] [Dark]
 * All icon-only buttons carry explicit aria-label per accessibility best practice
 * (mirrors kosmyn-admin/.../preview-dialog.tsx:211-266 pattern).
 */
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Bookmark,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

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
  dark: boolean;
  bookmarked: boolean;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDarkToggle: () => void;
  onBookmark: () => void;
}

export function ReaderToolbar(props: ReaderToolbarProps) {
  const {
    currentPage,
    numPages,
    maxPage,
    zoom,
    dark,
    bookmarked,
    onPageChange,
    onZoomIn,
    onZoomOut,
    onDarkToggle,
    onBookmark,
  } = props;

  // D-06: effectiveMax is the upper bound for nav controls; numPages stays as
  // the indicator denominator so the user always sees "Página X de <real-total>".
  const effectiveMax = maxPage ?? numPages;

  const onJumpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    if (Number.isNaN(raw)) return;
    const clamped = Math.max(1, Math.min(effectiveMax || 1, raw));
    onPageChange(clamped);
  };

  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Página anterior"
        disabled={currentPage <= 1 || numPages === 0}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      <div className="flex items-center gap-2 text-sm">
        <span aria-live="polite">
          Página {currentPage} de {numPages || '—'}
        </span>
        <Input
          type="number"
          min={1}
          max={effectiveMax || 1}
          value={currentPage}
          onChange={onJumpChange}
          aria-label="Pular para página"
          className="w-16 h-8"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Próxima página"
        disabled={currentPage >= effectiveMax || effectiveMax === 0}
        onClick={() => onPageChange(Math.min(effectiveMax || currentPage, currentPage + 1))}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button
        variant="ghost"
        size="icon"
        aria-label="Diminuir zoom"
        disabled={zoom <= ZOOM_MIN}
        onClick={onZoomOut}
      >
        <ZoomOut className="h-4 w-4" aria-hidden="true" />
      </Button>
      <span className="font-mono text-xs w-12 text-center">
        {Math.round(zoom * 100)}%
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Aumentar zoom"
        disabled={zoom >= ZOOM_MAX}
        onClick={onZoomIn}
      >
        <ZoomIn className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button
        variant={bookmarked ? 'default' : 'ghost'}
        size="icon"
        aria-label={bookmarked ? 'Remover marcador' : 'Marcar página'}
        aria-pressed={bookmarked}
        onClick={onBookmark}
      >
        <Bookmark className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Alternar tema escuro"
        onClick={onDarkToggle}
      >
        {dark ? (
          <Sun className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Moon className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
