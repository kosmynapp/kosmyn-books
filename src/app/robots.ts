// Milestone v1.4 Phase 30 — robots.txt
// Allows crawling, points to sitemap.

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/'],
      },
    ],
    sitemap: 'https://books.kosmyn.com/sitemap.xml',
    host: 'https://books.kosmyn.com',
  };
}
