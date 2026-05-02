/**
 * Client for /api/v1/books/programs/:slug/ratings.
 *
 * All POST/DELETE/GET-/me require an authenticated user with verified email.
 * The backend validates JWT and emailVerified.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_KOSMYN_API_URL ?? 'https://api.kosmyn.com/api/v1';
const DEFAULT_TENANT_ID =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? 'default';

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Tenant-Id': DEFAULT_TENANT_ID,
    Authorization: `Bearer ${token}`,
  };
}

export interface RatingResult {
  rating: number;
  programRatingAvg: number | null;
  programRatingCount: number;
}

export async function submitRating(
  slug: string,
  rating: number,
  token: string,
): Promise<RatingResult> {
  const res = await fetch(`${API_BASE}/books/programs/${slug}/ratings`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ rating }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function removeRating(slug: string, token: string) {
  const res = await fetch(`${API_BASE}/books/programs/${slug}/ratings`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getMyRating(
  slug: string,
  token: string,
): Promise<{ rating: number | null }> {
  const res = await fetch(`${API_BASE}/books/programs/${slug}/ratings/me`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return { rating: null };
  return res.json();
}
