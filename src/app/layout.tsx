import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { fetchPublicFlag } from '@/lib/feature-flags';
import { getBookPrograms } from '@/lib/api/books';
import { ComingSoonLanding } from '@/components/layout/coming-soon';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { AuthProvider } from '@/lib/auth-context';
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
          <ComingSoonLanding teaser={teaser} />
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR" className={fontVars}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
