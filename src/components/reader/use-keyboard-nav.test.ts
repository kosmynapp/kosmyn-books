/**
 * Phase 31 Plan 02 — useKeyboardNav unit tests (RDR-03).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardNav } from './use-keyboard-nav';

function fireKey(key: string, target?: HTMLElement) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  if (target) {
    Object.defineProperty(event, 'target', { value: target, enumerable: true });
  }
  window.dispatchEvent(event);
}

describe('useKeyboardNav (Phase 31 RDR-03)', () => {
  let onNext: ReturnType<typeof vi.fn>;
  let onPrev: ReturnType<typeof vi.fn>;
  let onZoomIn: ReturnType<typeof vi.fn>;
  let onZoomOut: ReturnType<typeof vi.fn>;
  let onToggleFullscreen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onNext = vi.fn();
    onPrev = vi.fn();
    onZoomIn = vi.fn();
    onZoomOut = vi.fn();
    onToggleFullscreen = vi.fn();
    renderHook(() =>
      useKeyboardNav({ onNext, onPrev, onZoomIn, onZoomOut, onToggleFullscreen }),
    );
  });

  it('ArrowRight invokes onNext', () => {
    fireKey('ArrowRight');
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('ArrowLeft invokes onPrev', () => {
    fireKey('ArrowLeft');
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('"+" or "=" invokes onZoomIn', () => {
    fireKey('+');
    fireKey('=');
    expect(onZoomIn).toHaveBeenCalledTimes(2);
  });

  it('"-" invokes onZoomOut', () => {
    fireKey('-');
    expect(onZoomOut).toHaveBeenCalledTimes(1);
  });

  it('"f" or "F" invokes onToggleFullscreen', () => {
    fireKey('f');
    fireKey('F');
    expect(onToggleFullscreen).toHaveBeenCalledTimes(2);
  });

  it('ignores key events when target is an <input>', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireKey('ArrowRight', input);
    expect(onNext).not.toHaveBeenCalled();
    input.remove();
  });
});
