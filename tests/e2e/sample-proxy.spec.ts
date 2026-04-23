import { test, expect } from '@playwright/test';
import { READER_FIXTURE_SLUG } from './fixtures/reader-fixture';

/**
 * Phase 31 RDR-02/D-03/D-13 — Sample proxy contract.
 *
 * Asserts the /api/sample/[slug] endpoint behaves correctly without
 * needing pdfjs to render. Pure HTTP-level contract checks.
 */

test.describe('Sample PDF proxy (Phase 31 D-03/D-13)', () => {
  test('GET returns 200 + application/pdf + Accept-Ranges + immutable cache', async ({
    request,
  }) => {
    const res = await request.get(`/api/sample/${READER_FIXTURE_SLUG}`);
    expect(res.status(), 'sample proxy must return 200').toBe(200);
    const headers = res.headers();
    expect(
      headers['content-type'],
      'Content-Type must be application/pdf',
    ).toBe('application/pdf');
    expect(
      headers['accept-ranges'],
      'Accept-Ranges must advertise bytes (D-03)',
    ).toBe('bytes');
    expect(
      headers['cache-control'],
      'Cache-Control must be public + immutable (Phase 25 immutable editions)',
    ).toMatch(/public.*immutable/);
  });

  test('GET with Range header returns 206 Partial Content + Content-Range', async ({
    request,
  }) => {
    const res = await request.get(`/api/sample/${READER_FIXTURE_SLUG}`, {
      headers: { Range: 'bytes=0-1023' },
    });
    expect(
      res.status(),
      'Range request must return 206 Partial Content (HTTP Range support is required for pdfjs streaming)',
    ).toBe(206);
    const headers = res.headers();
    expect(
      headers['content-range'],
      'Content-Range header must be present on 206',
    ).toMatch(/bytes \d+-\d+\/\d+/);
  });

  test('GET unknown slug returns 404', async ({ request }) => {
    const res = await request.get('/api/sample/this-slug-does-not-exist-31-03');
    expect(res.status(), 'unknown slug must return 404').toBe(404);
  });

  test('Content-Disposition is NOT attachment (reader is inline rendering)', async ({
    request,
  }) => {
    const res = await request.get(`/api/sample/${READER_FIXTURE_SLUG}`);
    const cd = res.headers()['content-disposition'];
    if (cd) {
      expect(
        cd,
        'sample proxy must NOT force attachment download',
      ).not.toMatch(/attachment/i);
    }
    // No Content-Disposition at all is also acceptable.
  });
});
