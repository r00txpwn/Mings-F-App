import type { HTMLAttributes, ReactNode } from 'react';
import { Card as ShadCard } from '@/components/shadcn/card';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'inset';
}

const paddingClass = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5 sm:p-6',
};

export function Card({
  children,
  padding = 'md',
  variant = 'default',
  className = '',
  ...props
}: CardProps) {
  return (
    <ShadCard
      className={cn(
        variant === 'inset' && 'bg-muted/40',
        paddingClass[padding],
        className,
      )}
      {...props}
    >
      {children}
    </ShadCard>
  );
}
