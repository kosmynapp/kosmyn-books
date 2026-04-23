'use client';
/**
 * Phase 31 Plan 02 — centralized keyboard navigation (D-09).
 *
 * Bindings:
 *   ArrowRight       → onNext()
 *   ArrowLeft        → onPrev()
 *   '+' or '='       → onZoomIn()
 *   '-'              → onZoomOut()
 *   'f' or 'F'       → onToggleFullscreen()
 *
 * Suppressed when the active element is an <input>, <textarea>, or
 * contentEditable — otherwise typing in the jump-to-page input would
 * page-flip on every digit.
 */
import { useEffect } from 'react';

export interface UseKeyboardNavHandlers {
  onNext: () => void;
  onPrev: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useKeyboardNav(handlers: UseKeyboardNavHandlers) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      switch (e.key) {
        case 'ArrowRight':
          handlers.onNext();
          break;
        case 'ArrowLeft':
          handlers.onPrev();
          break;
        case '+':
        case '=':
          handlers.onZoomIn();
          break;
        case '-':
          handlers.onZoomOut();
          break;
        case 'f':
        case 'F':
          handlers.onToggleFullscreen();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}
