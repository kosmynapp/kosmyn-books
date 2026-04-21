import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/lib/feature-flags', () => ({
  fetchPublicFlag: vi.fn(),
}));

vi.mock('@/lib/api/books', () => ({
  getBookPrograms: vi.fn().mockResolvedValue([
    { tenantId: 't1', currentEdition: { status: 'PUBLISHED' } },
    { tenantId: 't2', currentEdition: { status: 'PUBLISHED' } },
  ]),
}));

vi.mock('next/font/google', () => ({
  Source_Serif_4: () => ({
    variable: '--font-source-serif-4-mock',
    className: 'source-serif-4-mock',
  }),
}));

vi.mock('geist/font/sans', () => ({
  GeistSans: {
    variable: '--font-geist-sans-mock',
    className: 'geist-mock',
  },
}));

import { fetchPublicFlag } from '@/lib/feature-flags';
import RootLayout from './layout';

describe('RootLayout FF gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ComingSoonLanding when FF is false', async () => {
    (fetchPublicFlag as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const jsx = await RootLayout({ children: <div>live content</div> });
    const { container } = render(jsx as any);
    expect(container.innerHTML).toContain('books.kosmyn.com, em breve');
    expect(container.innerHTML).not.toContain('live content');
  });

  it('renders ComingSoonLanding when FF is null (fail-closed)', async () => {
    (fetchPublicFlag as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const jsx = await RootLayout({ children: <div>live content</div> });
    const { container } = render(jsx as any);
    expect(container.innerHTML).toContain('books.kosmyn.com, em breve');
  });

  it('renders live shell with header + children when FF is true', async () => {
    (fetchPublicFlag as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const jsx = await RootLayout({ children: <div>live content</div> });
    const { container } = render(jsx as any);
    expect(container.innerHTML).toContain('Kosmyn Books');
    expect(container.innerHTML).toContain('live content');
    expect(container.innerHTML).toContain('Explorar');
  });

  // <html> cannot be a child of <div>, so DOM rendering strips the tag.
  // Inspect the JSX tree directly via React element props for these assertions.

  it('html element has lang="pt-BR" in both branches', async () => {
    (fetchPublicFlag as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const coming = await RootLayout({ children: <div /> });
    expect((coming as any).props.lang).toBe('pt-BR');

    (fetchPublicFlag as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const live = await RootLayout({ children: <div /> });
    expect((live as any).props.lang).toBe('pt-BR');
  });

  it('injects Source Serif 4 + Geist Sans font variables on html', async () => {
    (fetchPublicFlag as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const jsx = await RootLayout({ children: <div /> });
    const className = (jsx as any).props.className as string;
    expect(className).toContain('--font-source-serif-4-mock');
    expect(className).toContain('--font-geist-sans-mock');
  });
});
