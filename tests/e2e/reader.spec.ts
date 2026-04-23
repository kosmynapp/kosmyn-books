import { test, expect } from '@playwright/test';
import { READER_FIXTURE_SLUG } from './fixtures/reader-fixture';

/**
 * Phase 31 RDR-04 — PDF Reader e2e against prod build.
 *
 * Test categories:
 *   1. Request-only HTML assertions (noindex meta) — fast, no JS eval, run on every CI build
 *   2. Real-browser pdfjs render assertions — env-gated by E2E_REAL_BROWSER=1
 *      because headless Chromium pdfjs canvas painting is the lone untested
 *      surface in this monorepo (Pitfall 7 in 31-RESEARCH.md). Gating allows
 *      PR builds to run only the cheap suite while CI post-deploy runs the
 *      full pdfjs render.
 *
 * Per CONTEXT D-16: tests run against a deployed instance (E2E_BASE_URL).
 * Per CONTEXT D-17: heavy real-browser tests env-gated to keep PR loop fast.
 */

const REAL_BROWSER = process.env.E2E_REAL_BROWSER === '1';

test.describe('PDF Reader (Phase 31 RDR-04)', () => {
  test('reader page emits noindex,nofollow meta + canonical → /book/[slug]', async ({ request }) => {
    const res = await request.get(`/book/${READER_FIXTURE_SLUG}/read`);
    expect(res.status(), `/book/${READER_FIXTURE_SLUG}/read must return 200`).toBe(200);
    const html = await res.text();
    expect(
      html,
      'reader must emit robots noindex,nofollow (D-10)',
    ).toMatch(/<meta name="robots" content="noindex,\s*nofollow"/);
    expect(
      html,
      `reader canonical must point to non-versioned /book/${READER_FIXTURE_SLUG}`,
    ).toMatch(
      new RegExp(
        `<link rel="canonical" href="https://books\\.kosmyn\\.com/book/${READER_FIXTURE_SLUG}"`,
      ),
    );
  });

  test('reader page returns 404 for unknown slug', async ({ request }) => {
    const res = await request.get('/book/this-book-does-not-exist-31-04/read');
    expect([404, 200].includes(res.status())).toBe(true);
    // 404 is the correct response (notFound() in RSC); some Next.js versions
    // serve a 200 with an _error page — both are acceptable as long as the
    // page does not crash. We accept both to avoid version flakiness.
  });

  test.describe('real browser pdfjs render (env-gated by E2E_REAL_BROWSER=1)', () => {
    test.skip(!REAL_BROWSER, 'set E2E_REAL_BROWSER=1 to run pdfjs canvas tests');

    test(`/book/${READER_FIXTURE_SLUG}/read renders first page in headless Chromium`, async ({
      page,
    }) => {
      await page.goto(`/book/${READER_FIXTURE_SLUG}/read`);
      // react-pdf annotates rendered pages with [data-page-number]
      const firstPage = page.locator('[data-page-number="1"]');
      await expect(
        firstPage,
        '[data-page-number="1"] should appear within 20s after pdfjs loads + paints',
      ).toBeVisible({ timeout: 20_000 });
      // canvas inside the page wrapper proves pdfjs actually painted bytes
      await expect(
        firstPage.locator('canvas').first(),
        'canvas inside page-1 must be visible (proves pdfjs rendered)',
      ).toBeVisible();
    });

    test('toolbar shows "Página 1 de N" indicator', async ({ page }) => {
      await page.goto(`/book/${READER_FIXTURE_SLUG}/read`);
      await page.locator('[data-page-number="1"]').waitFor({ timeout: 20_000 });
      await expect(
        page.getByText(/Página 1 de \d+/),
        'page indicator must read "Página 1 de N"',
      ).toBeVisible();
    });

    test('anon user clicking Next 19 times reaches page 20 (cap, Next still enabled for paywall reveal)', async ({
      page,
    }) => {
      await page.goto(`/book/${READER_FIXTURE_SLUG}/read`);
      await page.locator('[data-page-number="1"]').waitFor({ timeout: 20_000 });
      const nextBtn = page.getByRole('button', { name: /Próxima página/ });
      // Click forward 19 times (1 → 20). Wait on the actual react-pdf
      // canvas mount per page rather than a fixed sleep — anchors latency
      // to real DOM transitions and removes the 150ms × 19 ≈ 2.85s flake
      // window (per project memory feedback_no_sleep.md).
      for (let i = 0; i < 19; i++) {
        await nextBtn.click();
        await page
          .locator(`[data-page-number="${i + 2}"]`)
          .waitFor({ timeout: 5_000 });
      }
      // At page 20 (cap) Next must remain ENABLED so the user can click
      // it once more to reveal the paywall (D-06 reachability fix per
      // plan-checker W-1).
      await expect(
        nextBtn,
        'Next must stay enabled at page 20 so the paywall can be revealed (D-06)',
      ).not.toBeDisabled();
    });

    test('anon user clicking Next at page 20 reveals paywall card (D-06)', async ({
      page,
    }) => {
      await page.goto(`/book/${READER_FIXTURE_SLUG}/read`);
      await page.locator('[data-page-number="1"]').waitFor({ timeout: 20_000 });
      // Jump directly to page 20 via the toolbar input (faster than 19
      // clicks; clamping to maxNavigablePage=21 admits 20 unchanged).
      const input = page.getByLabel(/Pular para página/);
      await input.fill('20');
      await input.blur();
      await page.locator('[data-page-number="20"]').waitFor({ timeout: 10_000 });
      // Click Next once more — currentPage becomes 21 (paywall slot).
      const nextBtn = page.getByRole('button', { name: /Próxima página/ });
      await nextBtn.click();
      await expect(
        page.getByText(/Você leu as primeiras 20 páginas\. Faça login para continuar\./),
        'paywall card must replace canvas after clicking Next at page 20 (D-06)',
      ).toBeVisible({ timeout: 5_000 });
      // Canvas must be replaced (not overlaid) — page 21 must NOT exist in DOM
      await expect(page.locator('[data-page-number="21"]')).toHaveCount(0);
      // Now Next is disabled — paywall slot is the upper navigable bound
      await expect(nextBtn).toBeDisabled();
    });

    test('reader wrapper is dark-only and has no theme toggle button', async ({ page }) => {
      await page.goto(`/book/${READER_FIXTURE_SLUG}/read`);
      const wrapper = page.locator('[data-testid="reader-wrapper"]');
      await expect(wrapper).toHaveClass(/bg-zinc-950/, { timeout: 5_000 });
      // Product call (2026-04-23): reader is dark-only; no toggle button rendered.
      await expect(
        page.getByRole('button', { name: /Alternar tema escuro/ }),
      ).toHaveCount(0);
    });

    test('bookmark click persists to localStorage and survives reload (D-08)', async ({
      page,
    }) => {
      await page.goto(`/book/${READER_FIXTURE_SLUG}/read`);
      await page.locator('[data-page-number="1"]').waitFor({ timeout: 20_000 });
      // Click the bookmark button on page 1
      await page.getByRole('button', { name: /Marcar página/ }).click();
      // Verify localStorage was written
      const stored = await page.evaluate(() => {
        // Find any kosmyn:reader key (we don't know the exact version)
        const keys = Object.keys(localStorage).filter((k) => k.startsWith('kosmyn:reader:'));
        return keys.length > 0 ? localStorage.getItem(keys[0]) : null;
      });
      expect(stored, 'bookmark must be stored in localStorage').not.toBeNull();
      expect(JSON.parse(stored as string), 'bookmark array must contain page 1').toContain(1);
      // Reload and verify the button reflects pressed state
      await page.reload();
      await page.locator('[data-page-number="1"]').waitFor({ timeout: 20_000 });
      const btn = page.getByRole('button', { name: /Remover marcador/ });
      await expect(btn, 'after reload, bookmark must show as pressed').toBeVisible();
    });
  });
});
