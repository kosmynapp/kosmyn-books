'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoogleSignIn } from '@/components/auth/google-sign-in';
import { useAuth } from '@/lib/auth-context';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/browse';
  const { signIn, signInWithGoogle, error } = useAuth();
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

  const handleGoogleToken = useCallback(
    async (googleIdToken: string) => {
      setIsSubmitting(true);
      try {
        await signInWithGoogle(googleIdToken);
        router.push(redirect);
      } catch {
        // error is surfaced via context
      } finally {
        setIsSubmitting(false);
      }
    },
    [signInWithGoogle, router, redirect],
  );

  return (
    <main className="relative z-10 flex min-h-[calc(100vh-8rem)] items-center justify-center px-6 py-16">
      <div className="glass-card w-full max-w-[28rem] p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Entrar
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Use sua conta Kosmyn para baixar livros.
          </p>
        </div>

        <div className="mb-6">
          <GoogleSignIn onToken={handleGoogleToken} />
        </div>

        <div className="relative my-6 flex items-center">
          <div className="flex-grow border-t border-border" />
          <span className="mx-4 text-xs uppercase tracking-wider text-text-tertiary">
            ou com e-mail
          </span>
          <div className="flex-grow border-t border-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="voce@email.com"
              required
              autoFocus
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="aurora-gradient w-full border-0 text-white hover:opacity-90"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Não tem conta?{' '}
          <Link
            href="https://kosmyn.com/download"
            className="text-accent underline-offset-2 hover:underline"
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
    <Suspense
      fallback={<main className="min-h-[calc(100vh-8rem)]" />}
    >
      <LoginForm />
    </Suspense>
  );
}
