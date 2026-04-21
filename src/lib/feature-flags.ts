import { unstable_cache } from 'next/cache';

const API_BASE =
  process.env.NEXT_PUBLIC_KOSMYN_API_URL ?? 'https://api.kosmyn.com/api/v1';

/**
 * Fetch a public (whitelisted) feature flag.
 *
 * Returns boolean | null:
 *  - true/false — concrete flag value from platform service
 *  - null — endpoint unreachable, 404, or parse failure (fail-closed: caller assumes OFF)
 *
 * Caching: unstable_cache 60s + Next.js fetch revalidate 60s. Worst-case delay on
 * flag flip = 60s. Matches CONTEXT.md D-11 atomic-flip semantics.
 */
async function fetchPublicFlagInner(key: string): Promise<boolean | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/feature-flags/${encodeURIComponent(key)}`,
      {
        next: { revalidate: 60, tags: ['ff:public', `ff:${key}`] },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { key: string; enabled: boolean };
    return Boolean(data.enabled);
  } catch {
    return null;
  }
}

export const fetchPublicFlag = unstable_cache(
  fetchPublicFlagInner,
  ['public-flag'],
  { tags: ['ff:public'], revalidate: 60 },
);
