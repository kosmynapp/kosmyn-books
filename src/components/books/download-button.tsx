'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, BookOpen, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { getBookSignedUrl, AuthError } from '@/lib/api/library-download';

export interface DownloadButtonProps {
  slug: string;
  format: 'pdf' | 'epub';
  available: boolean;
  label: string;
  version?: string;
}

export function DownloadButton({
  slug,
  format,
  available,
  label,
  version,
}: DownloadButtonProps) {
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  if (!available) {
    return (
      <Button disabled variant="outline" size="lg" className="opacity-60">
        <Lock className="h-4 w-4" />
        {label}
        <span className="ml-1 text-sm">(em breve)</span>
      </Button>
    );
  }

  const redirectPath = `/book/${slug}${version ? `/v${version}` : ''}`;

  if (!user) {
    return (
      <Button
        asChild
        size="lg"
        variant={format === 'pdf' ? 'default' : 'outline'}
      >
        <Link href={`/login?redirect=${encodeURIComponent(redirectPath)}`}>
          <Lock className="h-4 w-4" />
          {label}
        </Link>
      </Button>
    );
  }

  const handleDownload = () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = getBookSignedUrl(slug, format);
      window.location.href = result.signedUrl;
    } catch (err) {
      if (err instanceof AuthError) {
        window.location.href = `/login?redirect=${encodeURIComponent(redirectPath)}`;
      } else {
        alert('Erro ao iniciar download. Tente novamente.');
        setSubmitting(false);
      }
    }
  };

  return (
    <Button
      onClick={handleDownload}
      size="lg"
      variant={format === 'pdf' ? 'default' : 'outline'}
      disabled={loading || submitting}
    >
      {submitting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : format === 'pdf' ? (
        <FileText className="h-4 w-4" />
      ) : (
        <BookOpen className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
