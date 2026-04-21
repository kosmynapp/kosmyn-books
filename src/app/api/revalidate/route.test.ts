import { describe, it, expect, vi, beforeEach } from 'vitest';

const revalidateTagMock = vi.fn();
vi.mock('next/cache', () => ({
  revalidateTag: (tag: string, profile: string) => revalidateTagMock(tag, profile),
}));

import { POST } from './route';

function makeRequest(body: unknown, secretHeader?: string) {
  const headers = new Headers();
  if (secretHeader !== undefined) {
    headers.set('x-webhook-secret', secretHeader);
  }
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }) as any;
}

describe('/api/revalidate POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REVALIDATE_SECRET = 'test-secret-32b';
  });

  it('returns 401 when x-webhook-secret header is missing', async () => {
    const req = makeRequest({ slug: 'test' });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('returns 401 when x-webhook-secret does not match', async () => {
    const req = makeRequest({ slug: 'test' }, 'wrong-secret');
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('returns 400 when slug is missing', async () => {
    const req = makeRequest({}, 'test-secret-32b');
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('returns 200 + calls revalidateTag on valid secret + slug', async () => {
    const req = makeRequest({ slug: 'my-book' }, 'test-secret-32b');
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ revalidated: true, slug: 'my-book' });
    expect(revalidateTagMock).toHaveBeenCalledWith('book:my-book', 'max');
    expect(revalidateTagMock).toHaveBeenCalledWith('books:featured', 'max');
    expect(revalidateTagMock).toHaveBeenCalledWith('books:browse', 'max');
    expect(revalidateTagMock).toHaveBeenCalledWith('books:all', 'max');
  });

  it('returns 500 if REVALIDATE_SECRET env var is unset', async () => {
    delete process.env.REVALIDATE_SECRET;
    const req = makeRequest({ slug: 'test' }, 'anything');
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
