'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            opts: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
              logo_alignment?: 'left' | 'center';
            },
          ) => void;
        };
      };
    };
  }
}

interface GoogleSignInProps {
  onToken: (idToken: string) => void;
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleSignIn({ onToken }: GoogleSignInProps) {
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;

    let canceled = false;

    function mount() {
      if (canceled || !window.google || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID!,
        callback: ({ credential }) => onToken(credential),
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 360,
      });
    }

    if (window.google?.accounts?.id) {
      mount();
      return;
    }

    const existing = document.getElementById(
      'google-gis-script',
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', mount, { once: true });
      return () => {
        canceled = true;
      };
    }

    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', mount, { once: true });
    document.body.appendChild(script);

    return () => {
      canceled = true;
    };
  }, [onToken]);

  if (!CLIENT_ID) {
    return (
      <p className="text-center text-sm text-text-tertiary">
        Google Sign-In indisponível (env var ausente).
      </p>
    );
  }

  return <div ref={btnRef} className="flex justify-center" />;
}
