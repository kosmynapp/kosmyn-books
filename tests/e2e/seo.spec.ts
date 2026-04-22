import { test, expect } from '@playwright/test';
import { SAMPLE_SLUGS, SAMPLE_VERSION } from './fixtures/sample-slugs';

/**
 * Phase 30 — SEO structural assertions.
 *
 * Validações contra prod (baseURL em playwright.config.ts):
 * - SEO-01: sitemap.xml returns 200 + <urlset> + contains sample slugs
 * - SEO-02: per-slug /book/[slug] contém JSON-LD Book parseable
 * - SEO-03: per-slug og:image aponta para R2 CDN (assets.kosmyn.com) ou fallback og-default.png
 *           — NUNCA a rota Next.js dinâmica /opengraph-image
 * - SEO-06: /book/[slug] canonical não-versionada; /book/[slug]/v[version] emite noindex,follow
 * - AUX:    / (root) contém JSON-LD WebSite + Organization
 *
 * Todos os testes são request-only (sem page.goto) — SEO é SSR, JS runtime irrelevante.
 * Pattern replicado de kosmyn-admin/e2e/sso-cross-domain.spec.ts:38-79.
 */

const OG_IMAGE_VALID_REGEX =
  /assets\.kosmyn\.com\/library\/.+\/v\d+\.\d+\.\d+\/og-1200x630\.png|books\.kosmyn\.com\/og-default\.png/;

test.describe('SEO structural assertions (Phase 30)', () => {
  test('sitemap.xml returns 200 with <urlset> and sample slugs', async ({ request, baseURL }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status(), 'sitemap.xml must be 200 OK').toBe(200);
    const body = await res.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('</urlset>');
    for (const slug of SAMPLE_SLUGS) {
      expect(body, `sitemap must contain ${slug}`).toContain(`${baseURL}/book/${slug}`);
    }
  });

  test('robots.txt points to sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/Sitemap:\s+https:\/\/books\.kosmyn\.com\/sitemap\.xml/);
  });

  for (const slug of SAMPLE_SLUGS) {
    test(`/book/${slug} has canonical + og:image R2 + JSON-LD Book`, async ({ request }) => {
      const res = await request.get(`/book/${slug}`);
      expect(res.status(), `/book/${slug} must be 200 OK`).toBe(200);
      const html = await res.text();

      // Canonical — não-versionado, exact URL
      expect(
        html,
        `canonical for ${slug} must be exact /book/${slug}`,
      ).toMatch(new RegExp(`<link rel="canonical" href="https://books\\.kosmyn\\.com/book/${slug}"`));

      // og:image — must NOT be old dynamic route; must be R2 CDN URL or fallback
      const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
      expect(ogMatch, `${slug} missing og:image meta`).not.toBeNull();
      const ogUrl = ogMatch![1];
      expect(
        ogUrl,
        `${slug} og:image must not use deleted dynamic route`,
      ).not.toContain('/opengraph-image');
      expect(
        ogUrl,
        `${slug} og:image must match R2 CDN or fallback pattern`,
      ).toMatch(OG_IMAGE_VALID_REGEX);

      // JSON-LD Book — parse all <script type="application/ld+json"> blocks
      const ldMatches = [...html.matchAll(
        /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
      )];
      expect(
        ldMatches.length,
        `${slug} must have at least 2 JSON-LD blocks (Book + Breadcrumb)`,
      ).toBeGreaterThanOrEqual(2);

      const parsed = ldMatches.map((m) => {
        try {
          return JSON.parse(m[1]);
        } catch (err) {
          throw new Error(`JSON-LD parse error on ${slug}: ${(err as Error).message}\nPayload: ${m[1].slice(0, 300)}`);
        }
      });

      const bookLd = parsed.find((obj) =>
        Array.isArray(obj['@type']) ? obj['@type'].includes('Book') : obj['@type'] === 'Book',
      );
      expect(bookLd, `${slug} missing @type=Book JSON-LD`).toBeDefined();
      expect(bookLd['@context']).toBe('https://schema.org');
      expect(bookLd.name).toBeTruthy();
      expect(bookLd.bookFormat).toBe('https://schema.org/EBook');
      expect(bookLd.publisher?.['@type']).toBe('Organization');
    });
  }

  test(`/book/<slug>/v<version> emits noindex,follow + canonical self-refer`, async ({ request }) => {
    const slug = SAMPLE_SLUGS[0];
    const version = SAMPLE_VERSION;
    const res = await request.get(`/book/${slug}/v${version}`);
    // Podem ser 200 (edition ainda existe) ou 404 (version não existe mais) — não fail no 404
    if (res.status() === 404) {
      test.skip(true, `${slug}/v${version} retornou 404 — edition não existe em prod; ajustar SAMPLE_VERSION env`);
    }
    expect(res.status(), `/book/${slug}/v${version} status`).toBe(200);
    const html = await res.text();

    expect(
      html,
      `v[version] must emit robots noindex,follow`,
    ).toMatch(/<meta name="robots" content="noindex,\s*follow"/);

    expect(
      html,
      `v[version] canonical must point to non-versioned slug`,
    ).toMatch(new RegExp(`<link rel="canonical" href="https://books\\.kosmyn\\.com/book/${slug}"`));
  });

  test('root / emits WebSite + Organization JSON-LD', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const html = await res.text();

    const ldMatches = [...html.matchAll(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    )];
    expect(
      ldMatches.length,
      'root must contain at least 2 JSON-LD blocks',
    ).toBeGreaterThanOrEqual(2);

    const types = ldMatches.map((m) => JSON.parse(m[1])['@type']);
    expect(types, 'root must contain WebSite JSON-LD').toContain('WebSite');
    expect(types, 'root must contain Organization JSON-LD').toContain('Organization');

    // WebSite must have SearchAction (Google sitelinks searchbox)
    const website = ldMatches
      .map((m) => JSON.parse(m[1]))
      .find((obj) => obj['@type'] === 'WebSite');
    expect(website.potentialAction?.['@type']).toBe('SearchAction');
    expect(website.inLanguage).toBe('pt-BR');
  });
});
