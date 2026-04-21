import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';

interface RevalidatePayload {
  slug?: string;
  eventType?: string;
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret');
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected) {
    console.error('[revalidate] REVALIDATE_SECRET env var not configured');
    return Response.json({ error: 'server misconfigured' }, { status: 500 });
  }
  if (!secret || secret !== expected) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: RevalidatePayload;
  try {
    payload = (await request.json()) as RevalidatePayload;
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!payload.slug) {
    return Response.json({ error: 'missing slug' }, { status: 400 });
  }

  revalidateTag(`book:${payload.slug}`, 'max');
  revalidateTag('books:featured', 'max');
  revalidateTag('books:browse', 'max');
  revalidateTag('books:all', 'max');

  return Response.json({ revalidated: true, slug: payload.slug });
}
