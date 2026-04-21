/**
 * API base URL for server-side fetches.
 *
 * Prefers KOSMYN_INTERNAL_API_URL (Railway internal DNS, bypasses Cloudflare
 * edge which 403s egress from Railway containers). Falls back to the public
 * URL for local dev where there's no private network.
 */
export const SERVER_API_BASE =
  process.env.KOSMYN_INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_KOSMYN_API_URL ??
  'https://api.kosmyn.com/api/v1';
