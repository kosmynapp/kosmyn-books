/**
 * Phase 45 Plan 03 — Tests for getPublicCrossTenantPrograms.
 *
 * Validates the cross-tenant aggregator client (single fetch, cache: 'no-store',
 * fail-soft to []). Endpoint canonical URL: /public/library/programs (relative
 * to API_BASE which already includes /api/v1).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { getPublicCrossTenantPrograms } = await import('../books');

beforeEach(() => {
  fetchMock.mockReset();
});

describe('getPublicCrossTenantPrograms', () => {
  it('calls /public/library/programs once with cache: no-store and returns parsed programs', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        programs: [
          { id: 'p1', slug: 'p1', tenantSlug: 't1', currentEdition: { status: 'PUBLISHED' } },
          { id: 'p2', slug: 'p2', tenantSlug: 't2', currentEdition: { status: 'PUBLISHED' } },
        ],
      }),
    });
    const result = await getPublicCrossTenantPrograms();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/public\/library\/programs$/);
    // D-10: cache must be no-store (NOT next.revalidate)
    const fetchOpts = fetchMock.mock.calls[0][1];
    expect(fetchOpts).toEqual(expect.objectContaining({ cache: 'no-store' }));
    expect(result).toHaveLength(2);
    expect(result[0].tenantSlug).toBe('t1');
  });

  it('filters out non-PUBLISHED editions', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        programs: [
          { id: 'p1', slug: 'p1', tenantSlug: 't1', currentEdition: { status: 'PUBLISHED' } },
          { id: 'p2', slug: 'p2', tenantSlug: 't2', currentEdition: { status: 'PREVIEW' } },
          { id: 'p3', slug: 'p3', tenantSlug: 't3', currentEdition: null },
        ],
      }),
    });
    const result = await getPublicCrossTenantPrograms();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('p1');
  });

  it('returns [] on non-2xx response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const result = await getPublicCrossTenantPrograms();
    expect(result).toEqual([]);
  });

  it('returns [] on fetch throw', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    const result = await getPublicCrossTenantPrograms();
    expect(result).toEqual([]);
  });
});
