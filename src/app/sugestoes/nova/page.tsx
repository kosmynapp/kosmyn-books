import { NewRequestForm } from './new-request-form';

export const dynamic = 'force-dynamic';

export default function NovaSugestaoPage() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Sugerir conteúdo
        </h1>
        <p className="mt-2 text-base text-text-secondary">
          Conta o que você quer ver virando livro. Outros leitores podem votar
          junto e os mais pedidos viram prioridade no roadmap editorial.
        </p>
      </header>
      <NewRequestForm />
    </main>
  );
}
