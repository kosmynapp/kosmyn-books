import { defineConfig } from '@playwright/test';

/**
 * Phase 30 — SEO structural E2E config.
 * Diverge de kosmyn-admin/playwright.config.ts em:
 *   - NO webServer: testes rodam contra prod deploy (feedback_e2e_production.md)
 *   - NO projects: SEO specs são request-only, sem auth setup
 *   - testDir ./tests/e2e: convenção desta phase (admin usa ./e2e)
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://books.kosmyn.com',
    extraHTTPHeaders: {
      'User-Agent': 'KosmynSEOBot/1.0 (+https://books.kosmyn.com; e2e-seo.yml)',
    },
  },
});
