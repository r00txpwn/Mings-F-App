import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/shadcn/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center border-dashed bg-muted/30 px-6 py-14 text-center',
        className,
      )}
    >
      {Icon ? <Icon className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden /> : null}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
