/**
 * Phase 30 — sample slugs para assertions SEO structural.
 *
 * Fonte: subset estável de programas PUBLISHED em prod. Evita flakiness
 * se um programa novo é publicado durante CI run.
 *
 * Override via env para debug local ou ajuste pós-cutover:
 *   E2E_SEO_SLUGS=slug1,slug2 npm run test:e2e
 *   E2E_SEO_SAMPLE_VERSION=1.0.0 npm run test:e2e
 */

const DEFAULT_SLUGS: readonly string[] = [
  'mitologia-grega',
  'saude-coletiva',
  'filosofia-antiga',
] as const;

export const SAMPLE_SLUGS: readonly string[] =
  process.env.E2E_SEO_SLUGS?.split(',').map((s) => s.trim()).filter(Boolean) ??
  DEFAULT_SLUGS;

export const SAMPLE_VERSION: string =
  process.env.E2E_SEO_SAMPLE_VERSION ?? '1.0.0';
