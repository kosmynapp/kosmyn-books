import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Página não encontrada.</h1>
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
