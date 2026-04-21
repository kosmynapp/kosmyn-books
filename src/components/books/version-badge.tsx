import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EditionStatus } from '@/lib/api/books';

export interface VersionBadgeProps {
  version: string;
  status: EditionStatus;
  isCurrent: boolean;
  className?: string;
}

export function VersionBadge({ version, status, isCurrent, className }: VersionBadgeProps) {
  if (isCurrent && status === 'PUBLISHED') {
    return (
      <Badge
        variant="outline"
        className={cn('numeric border-success/40 text-success', className)}
      >
        Edição atual · v{version}
      </Badge>
    );
  }

  if (status === 'DEPRECATED') {
    return (
      <Badge variant="outline" className={cn('numeric border-destructive/40 text-destructive', className)}>
        v{version} · Descontinuada
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn('numeric border-border text-text-secondary', className)}>
      v{version}
    </Badge>
  );
}
