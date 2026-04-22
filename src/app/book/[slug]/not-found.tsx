import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BookNotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-16rem)] w-full max-w-[42rem] flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold sm:text-4xl">Este livro não foi encontrado.</h1>
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
