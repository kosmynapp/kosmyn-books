export interface SignedUrlResult {
  signedUrl: string;
  expiresIn: number;
  fileName: string;
}

export class AuthError extends Error {
  constructor() {
    super('SESSION_EXPIRED');
    this.name = 'AuthError';
  }
}

/**
 * Resolve a download URL for a given book + format.
 *
 * Requires a session cookie (`kosmyn_token`, set at login). The URL returned
 * points at the own-origin proxy route `/api/download/<slug>/<format>`; the
 * backend URL + Bearer token are never exposed to the browser — the server
 * handler reads the cookie and streams the response.
 *
 * Throws `AuthError` if no session token is present in localStorage. Callers
 * should redirect to `/login?redirect=<current-path>` in that case so the
 * login flow can refresh the cookie.
 */
export function getBookSignedUrl(
  slug: string,
  format: 'pdf' | 'epub',
): SignedUrlResult {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('kosmyn_token')
      : null;

  if (!token) {
    throw new AuthError();
  }

  return {
    signedUrl: `/api/download/${encodeURIComponent(slug)}/${encodeURIComponent(format)}`,
    expiresIn: 300,
    fileName: `${slug}.${format}`,
  };
}
