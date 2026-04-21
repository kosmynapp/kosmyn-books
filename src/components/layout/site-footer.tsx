import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-4xl py-12">
      <div className="container mx-auto max-w-7xl px-4 text-center">
        <p className="text-sm text-text-tertiary">Uma biblioteca da plataforma Kosmyn.</p>
        <div className="mt-4 flex justify-center gap-6 text-sm text-text-secondary">
          <Link href="https://kosmyn.com" target="_blank" rel="noopener noreferrer">kosmyn.com</Link>
          <Link href="https://kosmyn.com/terms" target="_blank" rel="noopener noreferrer">Termos de uso</Link>
          <Link href="https://kosmyn.com/privacy" target="_blank" rel="noopener noreferrer">Privacidade</Link>
        </div>
      </div>
    </footer>
  );
}
