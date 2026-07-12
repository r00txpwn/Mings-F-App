import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Skeleton } from '@/components/shadcn/skeleton';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  compact?: boolean;
}

export function ChartCard({ title, actions, children, loading = false, compact = false }: ChartCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-sm">
      <CardHeader
        className={cn(
          'flex shrink-0 flex-row items-center justify-between gap-3 border-b py-0',
          compact ? 'px-3 py-2.5' : 'px-4 py-3',
        )}
      >
        <CardTitle className="min-w-0 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </CardTitle>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </CardHeader>
      <CardContent className={cn('min-h-0 flex-1', compact ? 'p-3' : 'p-4')}>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className={cn('w-full rounded-lg', compact ? 'h-44' : 'h-56')} />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
