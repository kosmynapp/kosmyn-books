'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { signIn, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await signIn(
        formData.get('email') as string,
        formData.get('password') as string,
      );
      router.push(redirect);
    } catch {
      // error is surfaced via context
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="container mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center px-md py-2xl">
      <div className="w-full rounded-lg border border-border bg-surface p-xl">
        <div className="mb-lg text-center">
          <h1 className="text-heading font-bold tracking-tight text-text-primary">
            Entrar
          </h1>
          <p className="mt-xs text-label text-text-secondary">
            Use sua conta Kosmyn para baixar livros.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-md">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-xs">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="voce@email.com"
              required
              autoFocus
            />
          </div>

          <div className="space-y-xs">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-lg text-center text-label text-text-secondary">
          Não tem conta?{' '}
          <Link
            href="https://kosmyn.com/download"
            className="text-accent hover:underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Baixe o app Kosmyn
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="container mx-auto py-2xl" />}>
      <LoginForm />
    </Suspense>
  );
}
