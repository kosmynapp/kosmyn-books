import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BookNotFound() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Este livro não foi encontrado.</h1>
      <p className="mt-4 text-base text-text-secondary">
        O link pode estar quebrado ou a edição foi removida.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/browse">Voltar para a biblioteca →</Link>
        </Button>
      </div>
    </main>
  );
}
