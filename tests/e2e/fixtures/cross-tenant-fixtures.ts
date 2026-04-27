/**
 * Phase 45 — fixtures for cross-tenant-library.spec.ts.
 *
 * KNOWN_PUBLIC_TENANTS: tenants with publicLibrary=true backfilled in production
 * by migration 20260427_tenant_public_library.sql.
 *
 * SAMPLE_TENANT_SCOPED_BOOK: a (tenantSlug, slug) tuple known to exist on prod.
 * Update this when prod data shifts; CI fails loud rather than silently regressing.
 */

export const KNOWN_PUBLIC_TENANTS = ['kosmyn', 'languages'] as const;

// Update this tuple if production data changes. CI fails when the slug 404s.
export const SAMPLE_TENANT_SCOPED_BOOK = {
  tenantSlug: 'languages',
  slug: 'english-riff',
} as const;
