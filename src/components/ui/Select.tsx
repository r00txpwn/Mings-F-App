import type { ReactNode, SelectHTMLAttributes } from 'react';
import { Label } from '@/components/shadcn/label';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
  compact?: boolean;
}

export function Select({ label, children, compact = false, className = '', id, ...props }: SelectProps) {
  const selectId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <div className="space-y-2">
      {label ? <Label htmlFor={selectId}>{label}</Label> : null}
      <select
        id={selectId}
        className={cn(
          'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
          compact && 'h-8 px-2 py-1.5 text-xs',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
