import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="container mx-auto max-w-2xl px-md py-4xl text-center">
      <h1 className="text-heading font-semibold">Página não encontrada.</h1>
      <p className="mt-md text-body text-text-secondary">
        O endereço que você acessou não existe.
      </p>
      <div className="mt-xl">
        <Button asChild>
          <Link href="/">Voltar para a home →</Link>
        </Button>
      </div>
    </main>
  );
}
