'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

export function SiteHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/80 backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/branding/kosmyn_logo_icon.png"
            alt="Kosmyn Books"
            width={32}
            height={32}
            priority
          />
          <span className="font-bold text-lg tracking-tight text-text-primary">
            Kosmyn Books
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/browse" className="text-sm text-text-secondary hover:text-text-primary">
            Explorar
          </Link>
          <Link href="/sugestoes" className="text-sm text-text-secondary hover:text-text-primary">
            Sugestões
          </Link>
          <Link
            href="https://kosmyn.com"
            className="text-sm text-text-secondary hover:text-text-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            kosmyn.com
          </Link>
          {user ? (
            <button
              onClick={() => {
                void signOut();
              }}
              className="text-sm text-text-secondary hover:text-text-primary"
              aria-label="Sair"
            >
              Sair
            </button>
          ) : (
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
