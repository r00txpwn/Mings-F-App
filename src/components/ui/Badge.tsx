import type { ReactNode } from 'react';
import { Badge as ShadBadge } from '@/components/shadcn/badge';
import { cn } from '@/lib/utils';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  danger: 'bg-destructive/15 text-destructive',
  info: 'bg-primary/15 text-primary',
};

export function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  return (
    <ShadBadge variant="secondary" className={cn('rounded-full text-[10px] uppercase tracking-wide', toneClass[tone], className)}>
      {children}
    </ShadBadge>
  );
}
