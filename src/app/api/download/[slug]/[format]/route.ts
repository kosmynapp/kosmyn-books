import { NextRequest, NextResponse } from 'next/server';
import { SERVER_API_BASE } from '@/lib/server-api-base';

const API_BASE = SERVER_API_BASE;
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID ?? 'default';

export const dynamic = 'force-dynamic';

/**
 * Server-side download proxy. Two-hop flow (matches kosmyn-site):
 *
 *   1. GET /books/book/:slug/signed-url?format=... with Bearer JWT
 *      → returns { signedUrl, token, expiresIn, fileName }. The short-lived
 *        download token is minted by the platform service and scoped to
 *        (slug, format, userId).
 *   2. GET /books/download/:slug?format=...&token=<dl-token>
 *      → streams the PDF/EPUB. The /download endpoint does NOT accept the
 *        JWT Bearer; it validates the download token and streams from R2.
 *
 * The JWT Bearer and the short-lived download token never leave the server.
 * The browser sees only a single same-origin GET returning the file stream.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; format: string }> },
) {
  const { slug, format } = await params;

  if (format !== 'pdf' && format !== 'epub') {
    return NextResponse.json(
      { error: 'format must be pdf or epub' },
      { status: 400 },
    );
  }

  const jwt = request.cookies.get('kosmyn_token')?.value;
  if (!jwt) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  // ── Hop 1: mint a short-lived download token ───────────────────────────
  const signedUrlEndpoint = `${API_BASE}/books/book/${encodeURIComponent(slug)}/signed-url?format=${encodeURIComponent(format)}`;
  let downloadToken: string;
  let fileName = `${slug}.${format}`;

  try {
    const res = await fetch(signedUrlEndpoint, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'X-Tenant-Id': DEFAULT_TENANT_ID,
      },
    });

    if (res.status === 401) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 },
      );
    }
    if (res.status === 404) {
      return NextResponse.json(
        { error: 'Book not available' },
        { status: 404 },
      );
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json(
        { error: text || 'Upstream error (signed-url)' },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      token?: string;
      signedUrl?: string;
      fileName?: string;
    };
    if (!data.token) {
      return NextResponse.json(
        { error: 'Upstream did not return download token' },
        { status: 502 },
      );
    }
    downloadToken = data.token;
    if (data.fileName) fileName = data.fileName;
  } catch {
    return NextResponse.json(
      { error: 'Failed to mint download token' },
      { status: 502 },
    );
  }

  // ── Hop 2: stream the artifact using the download token ────────────────
  const streamUrl = `${API_BASE}/books/download/${encodeURIComponent(slug)}?format=${encodeURIComponent(format)}&token=${encodeURIComponent(downloadToken)}`;

  try {
    const upstream = await fetch(streamUrl, {
      headers: {
        'X-Tenant-Id': DEFAULT_TENANT_ID,
      },
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return NextResponse.json(
        { error: text || 'Upstream error (stream)' },
        { status: upstream.status === 404 ? 404 : 502 },
      );
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition =
      upstream.headers.get('content-disposition') ||
      `attachment; filename="${fileName}"`;

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Content-Length': String(arrayBuffer.byteLength),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to stream download' },
      { status: 502 },
    );
  }
}
