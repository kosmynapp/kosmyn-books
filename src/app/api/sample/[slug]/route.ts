import { NextRequest, NextResponse } from 'next/server';
import { SERVER_API_BASE } from '@/lib/server-api-base';
import { getPublicCrossTenantPrograms } from '@/lib/api/books';

/**
 * Phase 31 Plan 02 — same-origin PDF sample proxy (D-03).
 *
 * Two-hop flow (R2 books bucket is private — Wave 0 audit):
 *   1. GET /books/sample/:slug   → { token, expiresIn, fileName }
 *      Mints a sample-scoped download token (anonymous-sample marker)
 *      via the public platform endpoint added by Task 0a.
 *   2. GET /books/download/:slug?format=pdf&token=... → streams from R2
 *      The download endpoint accepts the token without enforcing the
 *      'anonymous-sample' userId match (audit-only marker).
 *
 * NO auth required — sample reading is intentionally public per RDR-02.
 * The 20-page client-side limit is a UX nudge per project no-DRM stance
 * (T-31-04 accepted risk, see CONTEXT.md Out-of-Scope).
 *
 * Why proxy: avoids R2 CORS Range concerns + gives us a chokepoint for the
 * 50MB size guard (D-13) + hides R2 hostname from clients + R2 books bucket
 * is private so direct fetch returns 403 (Wave 0 audit).
 */
const API_BASE = SERVER_API_BASE;
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID ?? 'default';
const MAX_PDF_BYTES = 50_000_000; // D-13

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Phase 45: resolve the program's tenantId so samples work for any public
  // tenant. Falls back to DEFAULT_TENANT_ID when slug is not in the catalog.
  let tenantIdHeader = DEFAULT_TENANT_ID;
  try {
    const all = await getPublicCrossTenantPrograms();
    const match = all.find((p) => p.slug === slug);
    if (match?.tenantId) tenantIdHeader = match.tenantId;
  } catch {
    // keep DEFAULT_TENANT_ID fallback
  }

  // ── Hop 1: mint anonymous sample-scoped token ──────────────────────
  const sampleUrlEndpoint = `${API_BASE}/books/sample/${encodeURIComponent(slug)}`;
  let downloadToken: string;

  try {
    const res = await fetch(sampleUrlEndpoint, {
      headers: { 'X-Tenant-Id': tenantIdHeader },
    });
    if (res.status === 404) {
      return NextResponse.json({ error: 'Book not available' }, { status: 404 });
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Upstream error (sample-signed-url)' },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { token?: string };
    if (!data.token) {
      return NextResponse.json({ error: 'No sample token' }, { status: 502 });
    }
    downloadToken = data.token;
  } catch {
    return NextResponse.json(
      { error: 'Failed to mint sample token' },
      { status: 502 },
    );
  }

  // ── Hop 2: HEAD probe (D-13 size guard) ────────────────────────────
  const streamUrl = `${API_BASE}/books/download/${encodeURIComponent(slug)}?format=pdf&token=${encodeURIComponent(downloadToken)}`;
  try {
    const head = await fetch(streamUrl, { method: 'HEAD' });
    const cl = parseInt(head.headers.get('content-length') ?? '0', 10);
    if (cl > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: 'PDF too large for in-browser reader; use download instead' },
        { status: 413 },
      );
    }
  } catch {
    // HEAD failure is non-blocking — proceed and let the GET surface real errors.
  }

  // ── Hop 3: stream the PDF (no Range passthrough) ───────────────────
  // The upstream /books/download/:slug endpoint does NOT honor HTTP Range —
  // it always streams the full PDF and returns HTTP 200 even when Range is
  // sent. Advertising Accept-Ranges + serving 200 makes pdfjs throw
  // ("expected 206, got 200") and surfaces as Document.onLoadError.
  // Until upstream gains Range support, this proxy downloads the whole PDF
  // in a single fetch and serves it without Accept-Ranges so pdfjs treats
  // it as a non-streamable file (controlled client-side via disableRange:true
  // in reader-client.tsx PDF_OPTIONS).
  try {
    const upstream = await fetch(streamUrl);
    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'Upstream stream error' },
        { status: 502 },
      );
    }

    const respHeaders: Record<string, string> = {
      'Content-Type': 'application/pdf',
      // Edition is immutable per Phase 25 BE-01 — long cache safe.
      'Cache-Control': 'public, max-age=86400, immutable',
    };
    const cl = upstream.headers.get('content-length');
    if (cl) respHeaders['Content-Length'] = cl;

    return new NextResponse(upstream.body, {
      status: 200,
      headers: respHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to stream PDF' },
      { status: 502 },
    );
  }
}
