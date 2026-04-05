interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  subtitle?: string;
}

function getDeltaStyles(trend: KpiCardProps['trend']) {
  if (trend === 'up') {
    return 'bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/30';
  }
  if (trend === 'down') {
    return 'bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/25 dark:bg-rose-500/20 dark:text-rose-300 dark:ring-rose-500/30';
  }
  return 'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/15 dark:bg-slate-500/20 dark:text-slate-300 dark:ring-slate-500/25';
}

/** Invisible badge placeholder so cards without a delta keep the same top-right layout as cards with one */
function DeltaPlaceholder() {
  return (
    <span
      className="pointer-events-none inline-flex h-7 min-w-[2.75rem] select-none items-center justify-center rounded-full px-2 py-1 text-xs font-semibold opacity-0"
      aria-hidden
    >
      +0.0%
    </span>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  trend = 'neutral',
  loading = false,
  subtitle,
}: KpiCardProps) {
  const hasDelta = Boolean(delta);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition-shadow hover:shadow-neon dark:border-violet-400/20 dark:bg-slate-900/70 dark:shadow-neon-soft">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl dark:bg-violet-400/20" />

      {/* Header: label + delta slot (fixed height so all cards align) */}
      <div className="relative flex shrink-0 items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div className="flex shrink-0 items-center justify-end">
          {hasDelta ? (
            <span
              title={delta}
              className={`inline-flex h-7 max-w-[5.5rem] shrink-0 items-center justify-center truncate rounded-full px-2 py-1 text-xs font-semibold tabular-nums ${getDeltaStyles(
                trend
              )}`}
            >
              {delta}
            </span>
          ) : (
            <DeltaPlaceholder />
          )}
        </div>
      </div>

      {/* Primary value */}
      <div className="relative mt-2 shrink-0">
        {loading ? (
          <div className="h-9 w-28 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700/80" />
        ) : (
          <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
        )}
      </div>

      {/* Subtitle: fixed min height so rows stay even when some cards omit copy */}
      <p className="relative mt-1.5 min-h-[2.75rem] shrink-0 text-xs leading-snug text-slate-500 dark:text-slate-400">
        {subtitle ?? '\u00a0'}
      </p>

    </div>
  );
}
