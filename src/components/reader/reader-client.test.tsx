/**
 * Phase 31 Plan 02 — ReaderClient unit tests (RDR-01/02/03).
 *
 * Mock pattern from kosmyn-admin/src/app/(admin)/books/[programId]/_components/preview-dialog.test.tsx
 * (D-15). next/dynamic dispatches by prop shape; react-pdf is fully stubbed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mocks = vi.hoisted(() => ({
  user: null as null | { uid: string; email: string; displayName: string },
  loading: false,
  capturedFile: '' as string,
  capturedNumPages: 200,
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: mocks.user,
    loading: mocks.loading,
    error: null,
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('react-pdf', () => ({
  Document: ({
    children,
    onLoadSuccess,
    file,
  }: {
    children?: React.ReactNode;
    onLoadSuccess?: (info: { numPages: number }) => void;
    file?: string;
  }) => {
    if (typeof file === 'string') mocks.capturedFile = file;
    queueMicrotask(() => {
      onLoadSuccess?.({ numPages: mocks.capturedNumPages });
    });
    return <div data-testid="mock-document">{children}</div>;
  },
  Page: ({ pageNumber }: { pageNumber: number }) => (
    <div data-testid={`mock-page-${pageNumber}`} />
  ),
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}));

vi.mock('react-pdf/dist/Page/TextLayer.css', () => ({}));
vi.mock('react-pdf/dist/Page/AnnotationLayer.css', () => ({}));
vi.mock('@/lib/reader/pdf-worker-config', () => ({}));

vi.mock('next/dynamic', () => ({
  default: (_loader: () => Promise<unknown>) => {
    const DynWrapper = (props: Record<string, unknown>) => {
      if ('pageNumber' in props) {
        return (
          <div data-testid={`mock-page-${props.pageNumber as number}`} />
        );
      }
      const {
        children,
        onLoadSuccess,
        file,
      } = props as {
        children?: React.ReactNode;
        onLoadSuccess?: (info: { numPages: number }) => void;
        file?: string;
      };
      if (typeof file === 'string') mocks.capturedFile = file;
      queueMicrotask(() => {
        onLoadSuccess?.({ numPages: mocks.capturedNumPages });
      });
      return <div data-testid="mock-document">{children}</div>;
    };
    return DynWrapper;
  },
}));

import { ReaderClient } from './reader-client';

function renderReader(overrides: Partial<React.ComponentProps<typeof ReaderClient>> = {}) {
  return render(
    <ReaderClient
      slug="mitologia-grega"
      bookName="Mitologia Grega"
      version="1.0.0"
      pageCount={200}
      {...overrides}
    />,
  );
}

describe('ReaderClient (Phase 31 RDR-01/02/03)', () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.loading = false;
    mocks.capturedFile = '';
    mocks.capturedNumPages = 200;
    window.localStorage.clear();
  });

  it('anon user sees first page rendered', async () => {
    renderReader();
    expect(await screen.findByTestId('mock-document')).toBeInTheDocument();
    expect(await screen.findByTestId('mock-page-1')).toBeInTheDocument();
  });

  it('anon user clicking Next at page 20 reveals paywall card (D-06)', async () => {
    const user = userEvent.setup();
    renderReader();
    await screen.findByTestId('mock-document');
    // Jump to page 20 (the last sample page) via the toolbar input.
    // NOTE: fireEvent.change on a controlled <input type="number"> avoids the
    // userEvent.clear+type race where the controlled value re-syncs between
    // keystrokes (clear→empty triggers NaN early-return, leaving currentPage=1;
    // type('20') then appends to the re-synced '1' producing '120' → clamped 21).
    const input = screen.getByLabelText(/Pular para página/);
    fireEvent.change(input, { target: { value: '20' } });
    // At page 20, the canvas still renders the page (sample preview).
    expect(await screen.findByTestId('mock-page-20')).toBeInTheDocument();
    // Per D-06 the Next button must remain enabled at page 20 for anon
    // users when the PDF has more pages — clicking it reveals the paywall.
    const nextBtn = screen.getByRole('button', { name: /Próxima página/ });
    expect(nextBtn).not.toBeDisabled();
    await user.click(nextBtn);
    // currentPage advances to SAMPLE_LIMIT + 1 = 21, which triggers showPaywall.
    expect(
      await screen.findByText(/Faça login para continuar/),
    ).toBeInTheDocument();
    // The PDF canvas is replaced (not overlaid) per D-06.
    expect(screen.queryByTestId('mock-page-21')).not.toBeInTheDocument();
    // Now Next IS disabled — paywall slot is the upper bound (D-06 maxNavigablePage).
    expect(nextBtn).toBeDisabled();
  });

  it('anon user with PDF of exactly 20 pages — Next disables at end, no paywall (D-06)', async () => {
    // hasMoreThanSample === false → maxNavigablePage === maxAccessiblePage === 20
    mocks.capturedNumPages = 20;
    renderReader({ pageCount: 20 });
    await screen.findByTestId('mock-document');
    const input = screen.getByLabelText(/Pular para página/);
    fireEvent.change(input, { target: { value: '20' } });
    expect(await screen.findByTestId('mock-page-20')).toBeInTheDocument();
    const nextBtn = screen.getByRole('button', { name: /Próxima página/ });
    // At cap with no more pages — Next disabled, paywall not shown
    // (the user is not blocked by the paywall, they finished the sample).
    expect(nextBtn).toBeDisabled();
    expect(screen.queryByText(/Faça login para continuar/)).not.toBeInTheDocument();
  });

  it('anon user with pageCount=null waits for Document.onLoadSuccess before deciding paywall (D-12 revised post Wave 0)', async () => {
    // pageCount=null is the prod reality (backend hardcodes null). The paywall
    // must NOT show defensively — Document.onLoadSuccess will set numPages,
    // and the cap logic uses runtime numPages. The mock's onLoadSuccess fires
    // with capturedNumPages=200 immediately, so reliablePageCount becomes 200
    // and the reader is in normal sample-preview mode.
    renderReader({ pageCount: null });
    // After Document mounts and onLoadSuccess fires (mock), the reader is in
    // normal sample-preview mode — paywall card is NOT visible.
    await screen.findByTestId('mock-document');
    expect(screen.queryByText(/Faça login para continuar/)).not.toBeInTheDocument();
  });

  it('auth user sees full document (no paywall) even past page 20', async () => {
    mocks.user = { uid: 'u1', email: 'x@y.com', displayName: 'X' };
    renderReader();
    await screen.findByTestId('mock-document');
    const input = screen.getByLabelText(/Pular para página/);
    fireEvent.change(input, { target: { value: '21' } });
    // For auth user, maxAccessiblePage = numPages = 200, so page 21 is valid.
    expect(await screen.findByTestId('mock-page-21')).toBeInTheDocument();
    expect(screen.queryByText(/Faça login para continuar/)).not.toBeInTheDocument();
  });

  it('useAuth loading=true does not show paywall (avoids flicker)', () => {
    mocks.user = null;
    mocks.loading = true;
    renderReader({ pageCount: null });
    // Even though pageCount is null, the loading flag suppresses the paywall.
    expect(screen.queryByText(/Faça login para continuar/)).not.toBeInTheDocument();
  });

  it('dark mode wrapper has bg-zinc-950 by default; toggle switches to bg-zinc-100', async () => {
    const user = userEvent.setup();
    renderReader();
    const wrapper = await screen.findByTestId('reader-wrapper');
    expect(wrapper.className).toMatch(/bg-zinc-950/);
    const darkBtn = screen.getByRole('button', { name: /Alternar tema escuro/ });
    await user.click(darkBtn);
    expect(wrapper.className).toMatch(/bg-zinc-100/);
  });

  it('Document.file prop equals /api/sample/<slug> (D-03 same-origin proxy)', async () => {
    renderReader({ slug: 'direito' });
    await screen.findByTestId('mock-document');
    expect(mocks.capturedFile).toBe('/api/sample/direito');
  });
});
