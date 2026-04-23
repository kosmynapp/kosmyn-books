'use client';
/**
 * Phase 31 Plan 02 — module-level pdfjs worker config.
 *
 * MUST be imported at the top of every reader module ('use client' boundary).
 * MUST NOT be moved inside a render function (causes worker thrash; see
 * 31-RESEARCH.md anti-patterns + kosmyn-admin/.../preview-dialog.tsx:69-79).
 *
 * D-04: workerSrc points to `/pdf.worker.js` (NOT `.mjs` — Next.js does not
 * serve .mjs from /public). Plan 01 postinstall dual-writes both filenames.
 * D-04: leading-slash `${origin}` prefix is REQUIRED — pdfjs treats a bare
 * '/pdf.worker.js' as relative to the current route, breaking on /book/.../read.
 */
import { pdfjs } from 'react-pdf';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.js`;
}
