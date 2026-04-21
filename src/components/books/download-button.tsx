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

  // While AuthProvider is validating an existing token from localStorage,
  // `user` is null but we don't yet know whether the session is valid —
  // show a loading button instead of bouncing to /login, otherwise users
  // who are already logged in get kicked out on the first click.
  if (loading) {
    return (
      <Button
        disabled
        size="lg"
        variant={format === 'pdf' ? 'default' : 'outline'}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </Button>
    );
  }

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
      // Programmatic <a download> click → browser starts download without
      // navigating away, so we can reset the spinner immediately (the
      // Content-Disposition: attachment header means the browser never fires
      // a navigation/pageshow event we could hook into).
      const link = document.createElement('a');
      link.href = result.signedUrl;
      link.rel = 'noopener';
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Small delay to let the browser latch the download request before
      // the disabled state toggles back (prevents double-click double-fire).
      setTimeout(() => setSubmitting(false), 800);
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
