/**
 * Phase 31 Plan 02 — ReaderToolbar tests (RDR-03).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReaderToolbar } from './reader-toolbar';

function defaultProps(overrides: Partial<React.ComponentProps<typeof ReaderToolbar>> = {}) {
  return {
    bookName: 'Mitologia Grega',
    version: '1.0.0',
    currentPage: 1,
    numPages: 200,
    zoom: 1,
    bookmarks: [] as number[],
    onPageChange: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onBookmarkToggle: vi.fn(),
    ...overrides,
  };
}

describe('ReaderToolbar (Phase 31 RDR-03)', () => {
  it('renders "Página X de N" indicator', () => {
    render(<ReaderToolbar {...defaultProps({ currentPage: 1, numPages: 200 })} />);
    expect(screen.getByText(/Página 1 de 200/)).toBeInTheDocument();
  });

  it('jump-to input has min=1 max=numPages and value=currentPage', () => {
    render(<ReaderToolbar {...defaultProps({ currentPage: 7, numPages: 50 })} />);
    const input = screen.getByLabelText(/Pular para página/) as HTMLInputElement;
    expect(input.min).toBe('1');
    expect(input.max).toBe('50');
    expect(input.value).toBe('7');
  });

  it('jump-to onChange clamps to [1, numPages] and calls onPageChange', () => {
    const onPageChange = vi.fn();
    render(<ReaderToolbar {...defaultProps({ numPages: 10, onPageChange })} />);
    const input = screen.getByLabelText(/Pular para página/);
    fireEvent.change(input, { target: { value: '999' } });
    expect(onPageChange).toHaveBeenCalledWith(10);
    fireEvent.change(input, { target: { value: '0' } });
    expect(onPageChange).toHaveBeenCalledWith(1);
    fireEvent.change(input, { target: { value: '5' } });
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('Prev button disabled when currentPage===1', () => {
    render(<ReaderToolbar {...defaultProps({ currentPage: 1 })} />);
    expect(screen.getByRole('button', { name: /Página anterior/ })).toBeDisabled();
  });

  it('Next button disabled when currentPage===numPages', () => {
    render(<ReaderToolbar {...defaultProps({ currentPage: 50, numPages: 50 })} />);
    expect(screen.getByRole('button', { name: /Próxima página/ })).toBeDisabled();
  });

  it('maxPage prop overrides numPages for Next-disabled bound (D-06)', () => {
    // Anon scenario: numPages=200 (real total), maxPage=21 (sample cap + paywall slot).
    // Next must be ENABLED at page 20 and DISABLED at page 21 (paywall).
    const { rerender } = render(
      <ReaderToolbar {...defaultProps({ currentPage: 20, numPages: 200, maxPage: 21 })} />,
    );
    expect(screen.getByRole('button', { name: /Próxima página/ })).not.toBeDisabled();
    rerender(<ReaderToolbar {...defaultProps({ currentPage: 21, numPages: 200, maxPage: 21 })} />);
    expect(screen.getByRole('button', { name: /Próxima página/ })).toBeDisabled();
  });

  it('maxPage prop clamps jump-to input (D-06)', () => {
    const onPageChange = vi.fn();
    render(
      <ReaderToolbar {...defaultProps({ numPages: 200, maxPage: 21, onPageChange })} />,
    );
    const input = screen.getByLabelText(/Pular para página/) as HTMLInputElement;
    // input.max should reflect maxPage, not numPages
    expect(input.max).toBe('21');
    fireEvent.change(input, { target: { value: '999' } });
    expect(onPageChange).toHaveBeenCalledWith(21);
  });

  it('Fullscreen button renders when onToggleFullscreen is supplied and fires on click', async () => {
    const onToggleFullscreen = vi.fn();
    const user = userEvent.setup();
    render(<ReaderToolbar {...defaultProps({ onToggleFullscreen })} />);
    const btn = screen.getByRole('button', { name: /Modo tela cheia/ });
    await user.click(btn);
    expect(onToggleFullscreen).toHaveBeenCalledTimes(1);
  });

  it('Fullscreen button is not rendered when onToggleFullscreen prop is omitted', () => {
    render(<ReaderToolbar {...defaultProps()} />);
    expect(screen.queryByRole('button', { name: /Modo tela cheia/ })).toBeNull();
  });

  it('Bookmark trigger shows count badge + aria-pressed=true when current page is bookmarked', () => {
    render(<ReaderToolbar {...defaultProps({ currentPage: 5, bookmarks: [3, 5, 12] })} />);
    const btn = screen.getByRole('button', { name: /Marcadores \(3\)/ });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    // count badge visible
    expect(btn.querySelector('span')?.textContent).toBe('3');
  });

  it('Bookmark trigger label is "Marcadores (vazio)" when no bookmarks saved', () => {
    render(<ReaderToolbar {...defaultProps({ bookmarks: [] })} />);
    expect(screen.getByRole('button', { name: /Marcadores \(vazio\)/ })).toBeInTheDocument();
  });

  it('Zoom-in disabled at zoom===2.0; Zoom-out disabled at zoom===0.5', () => {
    const { rerender } = render(<ReaderToolbar {...defaultProps({ zoom: 2.0 })} />);
    expect(screen.getByRole('button', { name: /Aumentar zoom/ })).toBeDisabled();
    rerender(<ReaderToolbar {...defaultProps({ zoom: 0.5 })} />);
    expect(screen.getByRole('button', { name: /Diminuir zoom/ })).toBeDisabled();
  });
});
