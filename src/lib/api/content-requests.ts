/**
 * Client for /api/v1/content-requests (Sprint 3 — book suggestions).
 *
 * GET endpoints are public. POST/DELETE require an authenticated user; the
 * backend additionally enforces emailVerified for write operations and
 * applies daily rate limits (3 creates/day, 100 votes/day).
 */

const API_BASE =
  process.env.NEXT_PUBLIC_KOSMYN_API_URL ?? 'https://api.kosmyn.com/api/v1';
const DEFAULT_TENANT_ID =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? 'default';

export type ContentRequestStatus =
  | 'pending_review'
  | 'open'
  | 'planned'
  | 'in_production'
  | 'published'
  | 'declined';

export interface ContentRequest {
  id: string;
  title: string;
  description: string;
  suggestedSubjectSlug: string | null;
  suggestedLevelSlug: string | null;
  status: ContentRequestStatus;
  statusReason: string | null;
  fulfilledByProgramId: string | null;
  fulfilledByProgram: {
    id: string;
    slug: string;
    name: string;
  } | null;
  voteCount: number;
  hasUserVoted: boolean;
  isOwn: boolean;
  createdAt: string;
  updatedAt: string;
  submitter: {
    id: string;
    nickname: string;
    displayName: string;
  };
}

export interface ListResult {
  requests: ContentRequest[];
  total: number;
}

export interface SimilarRequest {
  id: string;
  title: string;
  voteCount: number;
  status: ContentRequestStatus;
  similarity: number;
}

function publicHeaders(token?: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Tenant-Id': DEFAULT_TENANT_ID,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function listContentRequests(
  params: {
    status?: ContentRequestStatus | 'all';
    sort?: 'top' | 'new';
    limit?: number;
    offset?: number;
  } = {},
  token?: string,
): Promise<ListResult> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.sort) qs.set('sort', params.sort);
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.offset !== undefined) qs.set('offset', String(params.offset));

  const url = `${API_BASE}/content-requests${qs.size > 0 ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: publicHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getContentRequest(
  id: string,
  token?: string,
): Promise<ContentRequest | null> {
  const res = await fetch(`${API_BASE}/content-requests/${encodeURIComponent(id)}`, {
    headers: publicHeaders(token),
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  const json = (await res.json()) as { request: ContentRequest };
  return json.request;
}

export interface CreateRequestInput {
  title: string;
  description: string;
  suggestedSubjectSlug?: string | null;
  suggestedLevelSlug?: string | null;
  forceCreate?: boolean;
}

export type CreateRequestResult =
  | { type: 'created'; request: ContentRequest }
  | { type: 'similar_found'; similar: SimilarRequest[] }
  | { type: 'rate_limited'; limit: number }
  | { type: 'auth_required' }
  | { type: 'verification_required' }
  | { type: 'error'; error: string };

export async function createContentRequest(
  input: CreateRequestInput,
  token: string,
): Promise<CreateRequestResult> {
  const res = await fetch(`${API_BASE}/content-requests`, {
    method: 'POST',
    headers: publicHeaders(token),
    body: JSON.stringify(input),
  });

  if (res.status === 201) {
    const json = (await res.json()) as { request: ContentRequest };
    return { type: 'created', request: json.request };
  }
  if (res.status === 409) {
    const json = (await res.json()) as { similar: SimilarRequest[] };
    return { type: 'similar_found', similar: json.similar };
  }
  if (res.status === 401) return { type: 'auth_required' };
  if (res.status === 403) return { type: 'verification_required' };
  if (res.status === 429) {
    const json = (await res.json().catch(() => ({}))) as { limit?: number };
    return { type: 'rate_limited', limit: json.limit ?? 3 };
  }
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return { type: 'error', error: body.error || `HTTP ${res.status}` };
}

export async function voteContentRequest(
  id: string,
  token: string,
): Promise<{ voteCount: number; hasUserVoted: true } | { error: string }> {
  const res = await fetch(`${API_BASE}/content-requests/${encodeURIComponent(id)}/vote`, {
    method: 'POST',
    headers: publicHeaders(token),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return { error: body.error || `HTTP ${res.status}` };
  }
  return res.json();
}

export async function unvoteContentRequest(
  id: string,
  token: string,
): Promise<{ voteCount: number; hasUserVoted: false } | { error: string }> {
  const res = await fetch(`${API_BASE}/content-requests/${encodeURIComponent(id)}/vote`, {
    method: 'DELETE',
    headers: publicHeaders(token),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    return { error: body.error || `HTTP ${res.status}` };
  }
  return res.json();
}

export async function deleteContentRequest(
  id: string,
  token: string,
): Promise<{ ok: true } | { error: string }> {
  const res = await fetch(`${API_BASE}/content-requests/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: publicHeaders(token),
  });
  if (res.status === 204 || res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return { error: body.error || `HTTP ${res.status}` };
}

const STATUS_LABELS_PT: Record<ContentRequestStatus, string> = {
  pending_review: 'Em revisão',
  open: 'Aberto',
  planned: 'Planejado',
  in_production: 'Em produção',
  published: 'Publicado',
  declined: 'Recusado',
};

export function statusLabel(status: ContentRequestStatus): string {
  return STATUS_LABELS_PT[status] ?? status;
}
