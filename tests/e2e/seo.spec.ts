import { test, expect } from '@playwright/test';
import { SAMPLE_SLUGS, SAMPLE_VERSION } from './fixtures/sample-slugs';

/**
 * Phase 30 — SEO structural assertions.
 *
 * Wave 0 (this plan, 30-01): stub com único smoke test para garantir
 * que a infra Playwright/CI está funcional antes de Wave 3 popular
 * com assertions reais.
 *
 * Wave 3 (plan 30-05): substitui este stub por 5 test cases cobrindo
 * sitemap.xml, robots.txt, /book/[slug] (canonical + og:image R2 +
 * JSON-LD Book), /book/[slug]/v[version] noindex, e root WebSite +
 * Organization JSON-LD. Fixtures SAMPLE_SLUGS + SAMPLE_VERSION já
 * disponíveis e consumidas aqui.
 */
test.describe('SEO structural assertions (Phase 30 — stub)', () => {
  test('fixtures load and expose at least 1 slug', () => {
    expect(SAMPLE_SLUGS.length).toBeGreaterThanOrEqual(1);
    expect(SAMPLE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test.skip('sitemap.xml returns 200 (Wave 3)', async () => {
    // Preenchido em plan 30-05
  });

  test.skip('/book/[slug] canonical + og:image R2 + JSON-LD Book (Wave 3)', async () => {
    // Preenchido em plan 30-05
  });

  test.skip('/book/[slug]/v[version] emits noindex,follow (Wave 3)', async () => {
    // Preenchido em plan 30-05
  });

  test.skip('root emits WebSite + Organization JSON-LD (Wave 3)', async () => {
    // Preenchido em plan 30-05
  });
});
