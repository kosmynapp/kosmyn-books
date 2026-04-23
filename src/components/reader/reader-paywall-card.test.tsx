/**
 * Phase 31 Plan 02 — ReaderPaywallCard tests (RDR-02 / D-06).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReaderPaywallCard } from './reader-paywall-card';

describe('ReaderPaywallCard (Phase 31 RDR-02 / D-06)', () => {
  it('renders D-06 headline with pagesShown count', () => {
    render(
      <ReaderPaywallCard
        slug="mitologia-grega"
        pagesShown={20}
        totalPages={200}
        onResetToFirstPage={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/Você leu as primeiras 20 páginas\. Faça login para continuar\./),
    ).toBeInTheDocument();
  });

  it('Login CTA links to /login with URL-encoded redirect param', () => {
    render(
      <ReaderPaywallCard
        slug="mitologia-grega"
        pagesShown={20}
        totalPages={200}
        onResetToFirstPage={vi.fn()}
      />,
    );
    const link = screen.getByRole('link', { name: /Fazer login para ler completo/ });
    expect(link).toHaveAttribute(
      'href',
      '/login?redirect=%2Fbook%2Fmitologia-grega%2Fread',
    );
  });

  it('"Voltar à página 1" invokes onResetToFirstPage', async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(
      <ReaderPaywallCard
        slug="mitologia-grega"
        pagesShown={20}
        totalPages={200}
        onResetToFirstPage={onReset}
      />,
    );
    const btn = screen.getByRole('button', { name: /Voltar à página 1/ });
    await user.click(btn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('shows totalPages summary line when totalPages > 0', () => {
    render(
      <ReaderPaywallCard
        slug="x"
        pagesShown={20}
        totalPages={123}
        onResetToFirstPage={vi.fn()}
      />,
    );
    expect(screen.getByText(/20 de 123 páginas exibidas/)).toBeInTheDocument();
  });

  it('card is centered (mx-auto class)', () => {
    const { container } = render(
      <ReaderPaywallCard
        slug="x"
        pagesShown={20}
        totalPages={200}
        onResetToFirstPage={vi.fn()}
      />,
    );
    const card = container.querySelector('[class*="mx-auto"]');
    expect(card).not.toBeNull();
  });
});
