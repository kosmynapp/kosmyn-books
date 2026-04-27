/**
 * Phase 45 — Public library catalog client (kosmyn-books).
 *
 * Delegates to `getPublicCrossTenantPrograms` in books.ts (single fetch to the
 * platform aggregator endpoint /api/v1/public/library/programs, fail-soft).
 *
 * Existed to mirror the API surface used by kosmyn-site/src/lib/api/library.ts
 * so server components can import `getPublicLibraryPrograms()` from a stable
 * path even when the underlying transport evolves.
 *
 * Server-side FF `crossTenantPublicLibrary` gates new vs legacy path:
 *   - ON  → catalog from Tenant.publicLibrary column (any tenant)
 *   - OFF → server returns the legacy whitelist (zero-regression fallback)
 *
 * Client always calls the same URL — FF resolution is server-side.
 */
import { getPublicCrossTenantPrograms, type LibraryProgram } from './books';

export type { LibraryProgram };

export async function getPublicLibraryPrograms(): Promise<LibraryProgram[]> {
  return getPublicCrossTenantPrograms();
}
