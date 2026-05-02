'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_BASE =
  process.env.NEXT_PUBLIC_KOSMYN_API_URL ?? 'https://api.kosmyn.com/api/v1';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const redirect = searchParams.get('redirect') || '/browse';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errCode = (body as { error?: string }).error || 'Código inválido';
        const friendly: Record<string, string> = {
          INVALID_CODE: 'Código incorreto. Verifique e tente de novo.',
          CODE_EXPIRED: 'Código expirado. Reenvie um novo.',
          USER_NOT_FOUND: 'E-mail não encontrado.',
          ALREADY_VERIFIED: 'Esta conta já está verificada. Faça login.',
        };
        throw new Error(friendly[errCode] || errCode);
      }
      // After verification, user must log in (the verify endpoint doesn't issue tokens here).
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao verificar');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setIsResending(true);
    try {
      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || 'Falha ao reenviar');
      }
      setInfo('Novo código enviado. Confira seu e-mail.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao reenviar');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="relative z-10 flex min-h-[calc(100vh-8rem)] items-center justify-center px-6 py-16">
      <div className="glass-card w-full max-w-[28rem] p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Verifique seu e-mail
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Enviamos um código de 6 dígitos para{' '}
            <span className="font-medium text-text-primary">{email || 'seu e-mail'}</span>.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {info && (
            <Alert>
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">Código de verificação</Label>
            <Input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              required
              autoFocus
              className="h-12 text-center text-xl font-mono tracking-widest"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="aurora-gradient w-full border-0 text-white hover:opacity-90"
            disabled={isSubmitting || code.length !== 6}
          >
            {isSubmitting ? 'Verificando...' : 'Verificar e continuar'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleResend}
            disabled={isResending || !email}
          >
            {isResending ? 'Reenviando...' : 'Reenviar código'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Já tem conta verificada?{' '}
          <Link
            href={`/login${redirect !== '/browse' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="text-accent underline-offset-2 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="min-h-[calc(100vh-8rem)]" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
