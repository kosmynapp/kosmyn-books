import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/80 backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-md">
        <Link href="/" className="font-serif text-heading font-semibold tracking-tight">
          Kosmyn Books
        </Link>
        <nav className="flex items-center gap-lg">
          <Link href="/browse" className="text-label text-text-secondary hover:text-text-primary">
            Explorar
          </Link>
          <Link
            href="https://kosmyn.com"
            className="text-label text-text-secondary hover:text-text-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            kosmyn.com
          </Link>
        </nav>
      </div>
    </header>
  );
}
