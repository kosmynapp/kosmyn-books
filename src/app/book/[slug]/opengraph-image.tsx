// Milestone v1.4 Phase 30 — dynamic OG image for /book/[slug]
// Renders via next/og Edge runtime: 1200x630, same design DNA as site.
// Pre-rendered pelo ISR (cache inherits from page revalidate=3600).

import { ImageResponse } from 'next/og';
import { getBookBySlug } from '@/lib/api/books';

export const runtime = 'nodejs';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };
export const alt = 'Kosmyn Books';

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const book = await getBookBySlug(params.slug);
  const title = book?.name ?? 'Kosmyn Books';
  const tenantName = book?.tenantName ?? 'Kosmyn';
  const version = book?.currentEdition?.version
    ? `v${book.currentEdition.version}`
    : '';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px 96px',
          background:
            'linear-gradient(135deg, #0B1020 0%, #161937 55%, #2a1f5c 100%)',
          color: '#F0F0FF',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header — brand + community */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA0C0' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 42, height: 42, background: '#8B5CF6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#0B1020' }}>
              K
            </div>
            <span style={{ color: '#F0F0FF', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'none' }}>Kosmyn Books</span>
          </div>
          <span>{tenantName}</span>
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              fontSize: title.length > 50 ? 64 : 80,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
          {book?.author && (
            <div style={{ fontSize: 32, color: '#9CA0C0' }}>por {book.author}</div>
          )}
        </div>

        {/* Footer — version + domain */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 22, color: '#9CA0C0' }}>
          <span>books.kosmyn.com</span>
          {version && (
            <span
              style={{
                padding: '6px 18px',
                background: '#8B5CF6',
                color: '#0B1020',
                borderRadius: 999,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              {version}
            </span>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
