import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BookNotFound() {
  return (
    <main className="container mx-auto max-w-2xl px-md py-4xl text-center">
      <h1 className="text-heading font-semibold">Este livro não foi encontrado.</h1>
      <p className="mt-md text-body text-text-secondary">
        O link pode estar quebrado ou a edição foi removida.
      </p>
      <div className="mt-xl">
        <Button asChild>
          <Link href="/browse">Voltar para a biblioteca →</Link>
        </Button>
      </div>
    </main>
  );
}
