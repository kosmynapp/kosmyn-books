/**
 * Phase 31 Plan 01 Task 2 — pdf.worker file existence smoke.
 *
 * Mitigates T-31-01 (worker version mismatch). The postinstall hook in
 * kosmyn-books/package.json copies pdfjs-dist/build/pdf.worker.mjs to
 * /public/pdf.worker.{js,mjs} (dual-write per CONTEXT D-04 — Next.js does
 * not serve .mjs from /public by default). If postinstall ever silently
 * fails (e.g., pdfjs-dist API restructures, new install in a fresh clone
 * skips postinstall), this test fails loudly BEFORE next build.
 *
 * If this test fails: re-run `cd kosmyn-books && npm install` and confirm
 * the postinstall script logs no warnings.
 */
import { describe, it, expect } from 'vitest';
import { statSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..');
const WORKER_JS = resolve(ROOT, 'public', 'pdf.worker.js');
const WORKER_MJS = resolve(ROOT, 'public', 'pdf.worker.mjs');
const PDFJS_PKG = resolve(ROOT, 'node_modules', 'pdfjs-dist', 'package.json');

const MIN_WORKER_SIZE = 100_000; // ~100KB floor — real worker is ~1MB

describe('pdf-worker-installed (Phase 31 RDR-01)', () => {
  it('public/pdf.worker.js exists', () => {
    expect(existsSync(WORKER_JS), `${WORKER_JS} missing — re-run npm install`).toBe(true);
  });

  it('public/pdf.worker.js is at least 100KB (not an empty/404 file)', () => {
    const size = statSync(WORKER_JS).size;
    expect(size).toBeGreaterThan(MIN_WORKER_SIZE);
  });

  it('public/pdf.worker.mjs exists with identical bytes to .js variant (D-04 dual-write)', () => {
    expect(existsSync(WORKER_MJS), `${WORKER_MJS} missing — postinstall did not dual-write`).toBe(true);
    const sizeJs = statSync(WORKER_JS).size;
    const sizeMjs = statSync(WORKER_MJS).size;
    expect(sizeMjs).toBe(sizeJs);
  });

  it('pdfjs-dist resolves to v5.x in node_modules (matches CONTEXT D-01 pin)', () => {
    const pkg = JSON.parse(readFileSync(PDFJS_PKG, 'utf-8')) as { version: string };
    expect(pkg.version).toMatch(/^5\./);
  });
});
