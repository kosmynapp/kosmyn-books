/**
 * Phase 31 Plan 01 — reader-specific test fixture.
 *
 * SAMPLE_SLUGS (Phase 30) targets SEO assertions and may include books with
 * pageCount <= 20, which would silently false-positive the RDR-02 anon-blocked
 * e2e (paywall card never renders if there's nothing to block past page 20).
 *
 * READER_FIXTURE_SLUG is audited as having pageCount > 20 in prod at the time
 * Plan 01 ran. Re-audit if e2e starts flaking (re-run the curl command in
 * 31-WAVE0-AUDIT.md).
 *
 * NOTE (Wave 0 finding 2026-04-22): the metadata API returns
 * `currentEdition.pageCount: null` for ALL 18 prod programs — backend doesn't
 * populate this column yet. Audit was performed against the local source PDFs
 * in kosmyn-content/tenants/default (same bytes that get uploaded to R2)
 * using pdfjs-dist getDocument().numPages. mitologia-grega = 106 pages.
 *
 * Override via env for debug:
 *   E2E_READER_SLUG=other-slug npm run test:e2e
 */
export const READER_FIXTURE_SLUG: string =
  process.env.E2E_READER_SLUG ?? 'mitologia-grega';

/** Audited page count at fixture-selection time. Re-verify if drifted. */
export const READER_FIXTURE_MIN_PAGES: number = 106;
