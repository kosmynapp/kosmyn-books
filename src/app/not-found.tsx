import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-16rem)] w-full max-w-[42rem] flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold sm:text-4xl">Página não encontrada.</h1>
      <p className="mt-4 text-base text-text-secondary">
        O endereço que você acessou não existe.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/">Voltar para a home →</Link>
        </Button>
      </div>
    </main>
  );
}
