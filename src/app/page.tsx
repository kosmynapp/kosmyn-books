import Link from 'next/link';
import { getBookPrograms } from '@/lib/api/books';
import { BookCard } from '@/components/books/book-card';
import { Button } from '@/components/ui/button';

export const revalidate = 3600;

export default async function HomePage() {
  const programs = await getBookPrograms();
  const featured = programs.slice(0, 6);

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden py-4xl md:py-4xl">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[400px]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(109,40,217,0.15) 0%, transparent 60%)',
          }}
          aria-hidden="true"
        />
        <div className="container relative mx-auto max-w-[600px] px-md text-center">
          <h1
            className="text-[32px] font-bold leading-[1.1] tracking-tight md:text-display"
            style={{
              background:
                'linear-gradient(135deg, #F0F0FF 0%, #F0F0FF 40%, #8B5CF6 70%, #60A5FA 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Leituras que viajam com você.
          </h1>
          <p className="mt-lg text-body text-text-secondary">
            Biblioteca aberta da Kosmyn — livros publicados pelas comunidades educacionais que constroem a plataforma.
          </p>
          <div className="mt-xl">
            <Button asChild size="lg">
              <Link href="/browse">Explorar biblioteca</Link>
            </Button>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container mx-auto max-w-7xl px-md py-2xl">
          <h2 className="mb-lg text-heading font-semibold">Livros em destaque</h2>
          <div className="grid grid-cols-2 gap-lg md:grid-cols-3 lg:grid-cols-3 lg:gap-xl">
            {featured.map((program, i) => (
              <BookCard key={program.id} program={program} priority={i < 3} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
