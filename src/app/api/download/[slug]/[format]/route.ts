import { NextRequest, NextResponse } from 'next/server';

const API_BASE =
  process.env.NEXT_PUBLIC_KOSMYN_API_URL ?? 'https://api.kosmyn.com/api/v1';
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID ?? 'default';

export const dynamic = 'force-dynamic';

/**
 * Server-side download proxy. The client calls this path; the handler reads
 * the `kosmyn_token` cookie, issues the upstream call with a Bearer header,
 * and streams the response back. The backend URL + token never reach the
 * browser.
 *
 * Upstream flow (from kosmyn-site reference):
 *   1. POST /books/download/init (or GET /books/book/:slug/signed-url) with
 *      Bearer token → receives a short-lived download token + canonical URL.
 *   2. Follow the signed URL to stream the artifact.
 *
 * To keep the books.kosmyn.com contract identical to kosmyn-site, we hit the
 * GET /books/download/:slug?format=... route directly — the platform service
 * accepts the Bearer token there and returns the streamed body with the right
 * Content-Disposition.
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

  const token = request.cookies.get('kosmyn_token')?.value;
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  const upstreamUrl = `${API_BASE}/books/download/${encodeURIComponent(slug)}?format=${encodeURIComponent(format)}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-Id': DEFAULT_TENANT_ID,
      },
    });

    if (upstream.status === 401) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 },
      );
    }

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return NextResponse.json(
        { error: text || 'Upstream error' },
        { status: upstream.status === 404 ? 404 : 502 },
      );
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition =
      upstream.headers.get('content-disposition') ||
      `attachment; filename="${slug}.${format}"`;

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
      { error: 'Failed to fetch download' },
      { status: 502 },
    );
  }
}
