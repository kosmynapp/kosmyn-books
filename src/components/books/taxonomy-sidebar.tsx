/**
 * TaxonomySidebar — sticky left sidebar with faceted taxonomy navigation.
 * Phase 37: used on browse, subject, level, exam, career pages.
 *
 * Each section renders only when it has at least 1 term.
 * On mobile, collapses to a horizontal scroll strip at the top.
 *
 * Usage:
 *   <TaxonomySidebar sections={...} mobileOnly />   — renders only the mobile strip
 *   <TaxonomySidebar sections={...} desktopOnly />  — renders only the desktop sidebar
 *   <TaxonomySidebar sections={...} />              — renders both (auto-hidden via CSS)
 */

import Link from 'next/link';
import type { TaxonomyTerm } from '@/lib/api/taxonomy';

export interface SidebarSection {
  title: string;
  terms: TaxonomyTerm[];
  hrefPrefix: string;
  /** If true, render hierarchically (depth-aware indentation) */
  hierarchical?: boolean;
  /** Max items to show before truncating */
  limit?: number;
}

interface TaxonomySidebarProps {
  sections: SidebarSection[];
  /** Slug of the currently active term (highlighted) */
  activeSlug?: string;
  /** Link for zero-results recovery */
  emptyRecoveryHref?: string;
  /** Render only the mobile strip */
  mobileOnly?: boolean;
  /** Render only the desktop sidebar */
  desktopOnly?: boolean;
}

function SidebarLink({
  href,
  label,
  icon,
  code,
  depth,
  active,
}: {
  href: string;
  label: string;
  icon?: string | null;
  code?: string | null;
  depth?: number;
  active?: boolean;
}) {
  const indent = depth ? depth * 12 : 0;
  const basePadLeft = indent > 0 ? `${indent + 14}px` : '14px';
  return (
    <Link
      href={href}
      style={{ paddingLeft: basePadLeft }}
      className={[
        'flex items-center gap-1.5 rounded-md pr-3 py-1.5 text-sm transition-colors border-l-2',
        active
          ? 'bg-primary/15 text-primary font-semibold border-primary'
          : 'text-text-secondary border-transparent hover:bg-muted hover:text-text-primary',
      ].join(' ')}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
      {code && (
        <span className="ml-auto shrink-0 font-mono text-xs opacity-50">{code}</span>
      )}
    </Link>
  );
}

export function TaxonomySidebar({
  sections,
  activeSlug,
  emptyRecoveryHref,
  mobileOnly = false,
  desktopOnly = false,
}: TaxonomySidebarProps) {
  // Filter out empty sections
  const visible = sections.filter((s) => s.terms.length > 0);

  if (visible.length === 0 && !emptyRecoveryHref) return null;

  return (
    <>
      {/* Desktop sidebar — hidden when mobileOnly */}
      {!mobileOnly && (
        <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
          <div className="sticky top-4 h-fit space-y-6 overflow-y-auto max-h-[calc(100vh-2rem)] pb-8">
            {visible.map((section) => {
              const terms = section.limit
                ? section.terms.slice(0, section.limit)
                : section.terms;
              return (
                <div key={section.title}>
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {section.title}
                  </h3>
                  <nav className="space-y-0.5">
                    {terms.map((term) => (
                      <SidebarLink
                        key={term.slug}
                        href={`${section.hrefPrefix}/${term.slug}`}
                        label={term.label}
                        icon={term.iconEmoji}
                        code={term.code}
                        depth={section.hierarchical ? term.depth : undefined}
                        active={term.slug === activeSlug}
                      />
                    ))}
                  </nav>
                </div>
              );
            })}

            {emptyRecoveryHref && (
              <div className="px-3">
                <Link
                  href={emptyRecoveryHref}
                  className="text-sm text-primary hover:underline"
                >
                  Ver todos os livros
                </Link>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Mobile: horizontal scroll strip — hidden when desktopOnly */}
      {!desktopOnly && (
        <div className="lg:hidden -mx-4 px-4 pb-4 overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            {visible.map((section) => {
              const terms = section.limit
                ? section.terms.slice(0, section.limit)
                : section.terms;
              return (
                <div key={section.title} className="shrink-0">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {section.title}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {terms.map((term) => (
                      <Link
                        key={term.slug}
                        href={`${section.hrefPrefix}/${term.slug}`}
                        className={[
                          'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors',
                          term.slug === activeSlug
                            ? 'bg-primary/15 text-primary font-semibold ring-1 ring-primary/40'
                            : 'bg-surface hover:bg-muted text-text-secondary',
                        ].join(' ')}
                      >
                        {term.iconEmoji && <span>{term.iconEmoji}</span>}
                        {term.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
