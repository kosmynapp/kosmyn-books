import type { Metadata } from 'next';
import { Source_Serif_4 } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { fetchPublicFlag } from '@/lib/feature-flags';
import { getBookPrograms } from '@/lib/api/books';
import { ComingSoonLanding } from '@/components/layout/coming-soon';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import './globals.css';

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-source-serif-4',
});

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
  const fontVars = `${GeistSans.variable} ${sourceSerif.variable}`;

  if (live !== true) {
    const teaser = await computeTeaserCount();
    return (
      <html lang="pt-BR" className={fontVars}>
        <body className="antialiased">
          <ComingSoonLanding teaser={teaser} />
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR" className={fontVars}>
      <body className="antialiased">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
