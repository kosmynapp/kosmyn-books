import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProgramsByFacets, getSubjectNode } from '@/lib/api/taxonomy';
import { BookCard } from '@/components/books/book-card';

export const revalidate = 3600;

interface Props {
  params: Promise<{ path: string[] }>;
}

export async function generateMetadata({ params }: Props) {
  const { path } = await params;
  const leaf = path[path.length - 1];
  const node = await getSubjectNode(leaf);
  return {
    title: node ? `${node.term.label} · Kosmyn Books` : 'Área · Kosmyn Books',
    description: node?.term.description ?? `Livros sobre ${leaf} na Kosmyn Books.`,
  };
}

export default async function SubjectPage({ params }: Props) {
  const { path } = await params;
  const leaf = path[path.length - 1];
  const node = await getSubjectNode(leaf);
  if (!node) notFound();

  const programs = await getProgramsByFacets({ subject: leaf });

  return (
    <main className="container mx-auto max-w-7xl px-4 py-12">
      <nav className="text-sm text-text-secondary mb-4">
        <Link href="/browse" className="hover:underline">Browse</Link>
        {path.map((seg, i) => {
          const href = '/subject/' + path.slice(0, i + 1).join('/');
          const isLast = i === path.length - 1;
          return (
            <span key={seg}>
              {' / '}
              {isLast ? (
                <span className="text-text-primary">{seg}</span>
              ) : (
                <Link href={href} className="hover:underline">{seg}</Link>
              )}
            </span>
          );
        })}
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          {node.term.iconEmoji && <span>{node.term.iconEmoji}</span>}
          {node.term.label}
          {node.term.code && (
            <span className="text-sm font-mono text-text-secondary">{node.term.code}</span>
          )}
        </h1>
        {node.term.description && (
          <p className="mt-2 text-text-secondary max-w-prose">{node.term.description}</p>
        )}
      </header>

      {node.children.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary mb-3">
            Sub-áreas
          </h2>
          <div className="flex flex-wrap gap-2">
            {node.children.map((child) => (
              <Link
                key={child.slug}
                href={`/subject/${[...path, child.slug].join('/')}`}
                className="px-3 py-1.5 rounded-full text-sm bg-surface hover:bg-muted transition"
              >
                {child.iconEmoji && <span className="mr-1">{child.iconEmoji}</span>}
                {child.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary mb-3">
          {programs.length} {programs.length === 1 ? 'livro' : 'livros'}
        </h2>
        {programs.length === 0 ? (
          <p className="text-text-secondary py-12 text-center">
            Ainda não há livros públicos nesta área. Volte em breve.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {programs.map((p) => (
              <BookCard key={p.id} program={p} />
            ))}
          </div>
        )}
      </section>

      {/* JSON-LD: schema.org/DefinedTerm + CollectionPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: node.term.label,
            description: node.term.description,
            about: {
              '@type': 'DefinedTerm',
              name: node.term.label,
              termCode: node.term.code ?? undefined,
              inDefinedTermSet: 'https://books.kosmyn.com/taxonomy',
              identifier: node.term.slug,
            },
            hasPart: programs.map((p) => ({
              '@type': 'Book',
              name: p.name,
              url: `https://books.kosmyn.com/book/${p.slug}`,
            })),
          }),
        }}
      />
    </main>
  );
}
