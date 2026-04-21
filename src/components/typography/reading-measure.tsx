import { cn } from '@/lib/utils';

export interface ReadingMeasureProps {
  children: React.ReactNode;
  width?: 'narrow' | 'wide';
  className?: string;
}

export function ReadingMeasure({ children, width = 'narrow', className }: ReadingMeasureProps) {
  return (
    <div
      className={cn(
        'text-body leading-[1.6] text-text-primary',
        width === 'narrow' ? 'max-w-[65ch]' : 'max-w-[75ch]',
        className,
      )}
    >
      {children}
    </div>
  );
}
