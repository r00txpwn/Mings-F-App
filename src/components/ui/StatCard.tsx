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
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800';
  }
  if (trend === 'down') {
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800';
  }
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700';
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
    <div
      className={`flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {hasDelta ? (
          <span
            title={delta}
            className={`inline-flex h-6 shrink-0 items-center justify-center rounded-full px-2 text-[11px] font-semibold tabular-nums ${getDeltaStyles(trend)}`}
          >
            {delta}
          </span>
        ) : null}
      </div>
      <div className="mt-2">
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        ) : (
          <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
        )}
      </div>
      {subtitle ? (
        <p className="mt-1.5 text-xs leading-snug text-slate-500 dark:text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  );
}
