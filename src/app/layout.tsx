import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { fetchPublicFlag } from '@/lib/feature-flags';
import { getBookPrograms } from '@/lib/api/books';
import { ComingSoonLanding } from '@/components/layout/coming-soon';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { AuthProvider } from '@/lib/auth-context';
import { StarField } from '@/components/effects/star-field';
import './globals.css';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

// Layout gates every page on the FF — run per request so a flag flip
// propagates immediately instead of waiting for ISR revalidation of the
// prerendered HTML. unstable_cache inside fetchPublicFlag still provides
// 60s throttling at the fetch layer.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://books.kosmyn.com'),
  title: 'Kosmyn Books',
  description: 'Biblioteca aberta da Kosmyn — livros publicados pelas comunidades educacionais.',
  openGraph: {
    title: 'Kosmyn Books',
    description: 'Biblioteca aberta da Kosmyn.',
    type: 'website',
    locale: 'pt_BR',
  },
};

async function computeTeaserCount(): Promise<{ books: number; communities: number }> {
  try {
    const programs = await getBookPrograms();
    const communities = new Set(programs.map((p) => p.tenantId)).size;
    return { books: programs.length, communities };
  } catch {
    return { books: 0, communities: 0 };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const live = await fetchPublicFlag('kBooksSubdomainLive');
  const fontVars = nunito.variable;

  if (live !== true) {
    const teaser = await computeTeaserCount();
    return (
      <html lang="pt-BR" className={fontVars}>
        <body className="font-sans antialiased">
          <StarField />
          <ComingSoonLanding teaser={teaser} />
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR" className={fontVars}>
      <body className="font-sans antialiased">
        <StarField />
        {/* Phase 30 D-06 — WebSite + Organization JSON-LD para sitelinks searchbox + brand knowledge graph.
            NÃO injetar no branch coming-soon (crawlers ignoram landing). Decisão locked: CONTEXT.md D-06. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Kosmyn Books',
              url: 'https://books.kosmyn.com',
              inLanguage: 'pt-BR',
              description: 'Biblioteca aberta da Kosmyn — livros publicados pelas comunidades educacionais.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://books.kosmyn.com/browse?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Kosmyn',
              url: 'https://kosmyn.com',
              logo: 'https://kosmyn.com/logo.png',
              sameAs: [
                'https://books.kosmyn.com',
                'https://admin.kosmyn.com',
              ],
            }),
          }}
        />
        <AuthProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
