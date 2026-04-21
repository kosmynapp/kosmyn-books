import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-4xl py-2xl">
      <div className="container mx-auto max-w-7xl px-md text-center">
        <p className="text-label text-text-tertiary">Uma biblioteca da plataforma Kosmyn.</p>
        <div className="mt-md flex justify-center gap-lg text-label text-text-secondary">
          <Link href="https://kosmyn.com" target="_blank" rel="noopener noreferrer">kosmyn.com</Link>
          <Link href="https://kosmyn.com/terms" target="_blank" rel="noopener noreferrer">Termos de uso</Link>
          <Link href="https://kosmyn.com/privacy" target="_blank" rel="noopener noreferrer">Privacidade</Link>
        </div>
      </div>
    </footer>
  );
}
