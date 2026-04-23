import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.kosmyn.com' },
      { protocol: 'https', hostname: 'kosmyn-library.*.r2.dev' },
    ],
  },
  // Phase 31 — pdfjs-dist 5.4.296 worker fallback.
  // Next.js does not serve `.mjs` files from /public by default (404s as HTML).
  // pdfjs-dist's internal fallback is `./pdf.worker.mjs` (relative) — if our
  // explicit workerSrc ever fails to apply (module-init race), pdfjs hits the
  // `.mjs` path resolved against the CURRENT route, e.g.
  // /book/estrategista/pdf.worker.mjs, and 404s → Document.onLoadError →
  // "Não foi possível carregar o PDF". Rewrite `.mjs` at any depth to the
  // real `/pdf.worker.js`. Mirrors kosmyn-admin (see admin/next.config.ts).
  rewrites: async () => [
    { source: '/pdf.worker.mjs', destination: '/pdf.worker.js' },
    { source: '/:path*/pdf.worker.mjs', destination: '/pdf.worker.js' },
  ],
};

export default nextConfig;
