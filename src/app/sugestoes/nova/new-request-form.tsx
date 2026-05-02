'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  createContentRequest,
  voteContentRequest,
  type SimilarRequest,
} from '@/lib/api/content-requests';

export function NewRequestForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectSlug, setSubjectSlug] = useState('');
  const [levelSlug, setLevelSlug] = useState('');
  const [similar, setSimilar] = useState<SimilarRequest[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (loading) {
    return <p className="text-text-secondary">Carregando…</p>;
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <p className="text-text-primary">
          É preciso ter conta para sugerir conteúdo.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/login?redirect=/sugestoes/nova"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-300"
          >
            Entrar
          </Link>
          <Link
            href="/signup?redirect=/sugestoes/nova"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary hover:border-text-primary"
          >
            Criar conta
          </Link>
        </div>
      </div>
    );
  }

  async function submit(e: FormEvent, forceCreate = false) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem('kosmyn_token');
    if (!token) {
      setError('Sessão expirada. Faça login de novo.');
      return;
    }

    if (title.trim().length < 3) {
      setError('O título precisa ter pelo menos 3 caracteres.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Descreva com pelo menos 10 caracteres.');
      return;
    }

    setBusy(true);
    try {
      const result = await createContentRequest(
        {
          title: title.trim(),
          description: description.trim(),
          suggestedSubjectSlug: subjectSlug.trim() || null,
          suggestedLevelSlug: levelSlug.trim() || null,
          forceCreate,
        },
        token,
      );

      switch (result.type) {
        case 'created':
          setSuccess(
            'Sugestão recebida! Vamos revisar antes de exibir publicamente — você pode acompanhar em "Minhas em revisão".',
          );
          // Brief pause so user sees the toast, then route to list
          setTimeout(() => router.push('/sugestoes?tab=mine'), 1500);
          break;
        case 'similar_found':
          setSimilar(result.similar);
          break;
        case 'rate_limited':
          setError(`Você já enviou ${result.limit} sugestões hoje. Volta amanhã.`);
          break;
        case 'auth_required':
          setError('Faça login para sugerir.');
          break;
        case 'verification_required':
          setError('Verifique seu e-mail antes de enviar uma sugestão.');
          break;
        case 'error':
          setError(humanError(result.error));
          break;
      }
    } finally {
      setBusy(false);
    }
  }

  async function voteOnSimilar(id: string) {
    const token = localStorage.getItem('kosmyn_token');
    if (!token) return;
    const r = await voteContentRequest(id, token);
    if ('error' in r) {
      setError(humanError(r.error));
      return;
    }
    setSuccess('Voto registrado!');
    setTimeout(() => router.push('/sugestoes'), 600);
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => submit(e, false)}>
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-text-primary">
          Título da sugestão
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={120}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSimilar(null);
          }}
          placeholder="Ex: Curso de Rust para iniciantes"
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:border-amber-400 focus:outline-none"
        />
        <p className="mt-1 text-xs text-text-tertiary">{title.length}/120</p>
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-text-primary">
          Descrição
        </label>
        <textarea
          id="description"
          required
          rows={5}
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Conta o que você gostaria de aprender, qual o público-alvo, e por que esse livro seria útil."
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:border-amber-400 focus:outline-none"
        />
        <p className="mt-1 text-xs text-text-tertiary">{description.length}/1000</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-text-primary">
            Área (opcional)
          </label>
          <input
            id="subject"
            type="text"
            maxLength={80}
            value={subjectSlug}
            onChange={(e) => setSubjectSlug(e.target.value)}
            placeholder="programacao, matematica, biologia…"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="level" className="mb-1.5 block text-sm font-medium text-text-primary">
            Nível (opcional)
          </label>
          <input
            id="level"
            type="text"
            maxLength={80}
            value={levelSlug}
            onChange={(e) => setLevelSlug(e.target.value)}
            placeholder="iniciante, medio, avancado…"
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {similar && similar.length > 0 && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-400/5 p-4">
          <p className="text-sm font-medium text-amber-300">
            Algo parecido já foi pedido. Vote nas existentes ou envie mesmo assim:
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {similar.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-text-primary">{s.title}</p>
                  <p className="text-xs text-text-tertiary">
                    {s.voteCount} {s.voteCount === 1 ? 'voto' : 'votos'} · {(s.similarity * 100).toFixed(0)}% parecido
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => voteOnSimilar(s.id)}
                  className="shrink-0 rounded-md border border-amber-400 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-400/10"
                >
                  Votar
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={busy}
            onClick={(e) => submit(e, true)}
            className="mt-4 text-sm text-text-secondary underline hover:text-text-primary"
          >
            Enviar mesmo assim
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-400/40 bg-red-400/5 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald-400/40 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-300">
          {success}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50 hover:bg-amber-300"
        >
          {busy ? 'Enviando…' : 'Enviar sugestão'}
        </button>
        <Link
          href="/sugestoes"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function humanError(code: string): string {
  switch (code) {
    case 'AUTH_REQUIRED':
      return 'Faça login para sugerir.';
    case 'EMAIL_VERIFICATION_REQUIRED':
      return 'Verifique seu e-mail para sugerir.';
    case 'INVALID_BODY':
      return 'Algum campo está fora do formato esperado.';
    case 'RATE_LIMITED':
      return 'Limite diário atingido. Volta amanhã.';
    default:
      return code || 'Não foi possível enviar a sugestão.';
  }
}
