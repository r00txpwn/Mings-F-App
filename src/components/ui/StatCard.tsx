import { Card } from '@/components/shadcn/card';
import { Skeleton } from '@/components/shadcn/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  subtitle?: string;
  compact?: boolean;
}

function getDeltaStyles(trend: StatCardProps['trend']) {
  if (trend === 'up') {
    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  }
  if (trend === 'down') {
    return 'bg-destructive/15 text-destructive';
  }
  return 'bg-muted text-muted-foreground';
}

export function StatCard({
  label,
  value,
  delta,
  trend = 'neutral',
  loading = false,
  subtitle,
  compact = false,
}: StatCardProps) {
  const hasDelta = Boolean(delta);

  return (
    <Card className={cn('flex flex-col shadow-sm', compact ? 'p-3' : 'p-4')}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        {hasDelta ? (
          <span
            title={delta}
            className={cn(
              'inline-flex h-6 shrink-0 items-center justify-center rounded-full px-2 text-[11px] font-semibold tabular-nums',
              getDeltaStyles(trend),
            )}
          >
            {delta}
          </span>
        ) : null}
      </div>
      <div className="mt-2">
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </p>
        )}
      </div>
      {subtitle ? <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{subtitle}</p> : null}
    </Card>
  );
}
