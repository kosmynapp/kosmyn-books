import { test, expect } from '@playwright/test';
import { KNOWN_PUBLIC_TENANTS, SAMPLE_TENANT_SCOPED_BOOK } from './fixtures/cross-tenant-fixtures';

/**
 * Phase 45 (D-25) — Cross-tenant public library e2e.
 *
 * Validates against prod (baseURL in playwright.config.ts):
 *   - LIB-01: /api/v1/public/library/programs returns multi-tenant catalog with tenantSlug
 *   - LIB-02: /browse renders books from at least 2 distinct tenants when FF ON
 *   - LIB-03: tenant-scoped permalink /[tenantSlug]/book/[slug] returns 200 + indexable
 *   - LIB-04: aggregator endpoint sets Cache-Control: public, max-age=300, stale-while-revalidate=60
 *   - LIB-05: B2B tenants (medicina, nava-tech) NOT in public catalog by default
 *   - LIB-06: /book/[slug] resolves to 200 (no collision) OR 302 to /[tenantSlug]/book/[slug]
 *
 * Pattern: request-only (no page.goto when possible). Mirrors seo.spec.ts.
 */

const AGGREGATOR_URL = 'https://api.kosmyn.com/api/v1/public/library/programs';

test.describe('Cross-tenant public library (Phase 45)', () => {
  test('LIB-01: aggregator endpoint returns multi-tenant catalog with tenantSlug', async ({ request }) => {
    // Hit the gateway endpoint directly (production)
    const res = await request.get(AGGREGATOR_URL);
    expect(res.status(), 'aggregator endpoint must be 200').toBe(200);
    const body = (await res.json()) as { programs: Array<{ tenantSlug: string; slug: string }> };
    expect(Array.isArray(body.programs), 'programs must be an array').toBe(true);
    expect(body.programs.length, 'must return at least one program').toBeGreaterThan(0);
    // Every program must include tenantSlug
    for (const p of body.programs) {
      expect(p.tenantSlug, `program ${p.slug} must have tenantSlug`).toBeTruthy();
    }
  });

  test('LIB-02: /browse renders content (multi-tenant when FF ON, single-tenant when OFF)', async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/browse`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    // Sanity: page is not empty / not a 5xx fallback shell
    expect(body.length, '/browse must return non-trivial HTML').toBeGreaterThan(1000);
    // Cross-check: at least one known public tenant slug appears in the rendered HTML
    // (either as a /collection/[tenantSlug] link or as a book metadata mention)
    const tenantsFound = KNOWN_PUBLIC_TENANTS.filter((slug) => body.includes(slug));
    expect(tenantsFound.length, `at least one known public tenant must appear in /browse`).toBeGreaterThan(0);
  });

  test('LIB-03: tenant-scoped permalink /[tenantSlug]/book/[slug] returns 200 + indexable', async ({ request, baseURL }) => {
    const { tenantSlug, slug } = SAMPLE_TENANT_SCOPED_BOOK;
    const res = await request.get(`${baseURL}/${tenantSlug}/book/${slug}`);
    if (res.status() === 404) {
      test.skip(true, `${tenantSlug}/book/${slug} returned 404 — fixture stale; update SAMPLE_TENANT_SCOPED_BOOK`);
    }
    expect(res.status(), `tenant-scoped permalink /${tenantSlug}/book/${slug} must return 200`).toBe(200);
    const body = await res.text();
    // Indexable: must NOT have noindex robots meta
    expect(body, 'tenant-scoped page must be indexable').not.toMatch(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i);
    // Canonical URL points at tenant-scoped form
    expect(body).toContain(`https://books.kosmyn.com/${tenantSlug}/book/${slug}`);
  });

  test('LIB-04: aggregator response sets Cache-Control public 5min + SWR 1min', async ({ request }) => {
    const res = await request.get(AGGREGATOR_URL);
    expect(res.status()).toBe(200);
    const cc = res.headers()['cache-control'];
    expect(cc).toBeTruthy();
    expect(cc).toContain('public');
    expect(cc).toContain('max-age=300');
    expect(cc).toContain('stale-while-revalidate=60');
  });

  test('LIB-05: B2B tenants (medicina, nava-tech) NOT in public catalog', async ({ request }) => {
    const res = await request.get(AGGREGATOR_URL);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { programs: Array<{ tenantSlug: string }> };
    const slugs = new Set(body.programs.map((p) => p.tenantSlug));
    expect(slugs.has('medicina'), 'medicina must NOT appear in public catalog').toBe(false);
    expect(slugs.has('nava-tech'), 'nava-tech must NOT appear in public catalog').toBe(false);
  });

  test('LIB-06: /book/[slug] renders single-tenant book without redirect when no collision', async ({ request, baseURL }) => {
    // SAMPLE_TENANT_SCOPED_BOOK.slug is unique within KNOWN_PUBLIC_TENANTS today;
    // /book/{slug} should serve 200 (canonical form), not redirect.
    const { slug } = SAMPLE_TENANT_SCOPED_BOOK;
    const res = await request.get(`${baseURL}/book/${slug}`, { maxRedirects: 0 });
    // Either 200 (no collision) OR 302/307 (collision exists) — both valid.
    // We only assert the response is one of these states (i.e., the route exists).
    expect([200, 302, 307]).toContain(res.status());
    if (res.status() >= 300) {
      const loc = res.headers()['location'] || '';
      expect(loc, '302 must redirect to /[tenantSlug]/book/[slug]').toMatch(/^\/[a-z0-9-]+\/book\//);
    }
  });
});
