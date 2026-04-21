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
};

export default nextConfig;
