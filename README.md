# kosmyn-books

books.kosmyn.com — Next.js 16 App Router + Tailwind 4 + shadcn/ui.

Dev: `NPM_TOKEN=$(gh auth token) npm install && npm run dev` (port 3010).
Build: `npm run build` (Next.js standalone output).
Env vars: see `.env.example`.

Routes: `/`, `/browse`, `/book/[slug]`, `/book/[slug]/v[version]`, `/collection/[tenantSlug]`, `/api/revalidate`.

FF `kBooksSubdomainLive` gates live vs coming-soon. Default OFF until Plan 28-05 flips it.

Deploy: Railway + Cloudflare DNS (Plan 28-05).
