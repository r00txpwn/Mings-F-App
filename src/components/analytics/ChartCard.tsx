import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  /** Tighter padding for dense dashboard rows. */
  compact?: boolean;
}

export function ChartCard({ title, actions, children, loading = false, compact = false }: ChartCardProps) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div
        className={`flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 ${
          compact ? 'px-3 py-2.5' : 'px-4 py-3'
        }`}
      >
        <h3 className="min-w-0 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {title}
        </h3>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className={`min-h-0 flex-1 ${compact ? 'p-3' : 'p-4'}`}>
        {loading ? (
          <div className="space-y-2">
            <div className="h-5 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700/80" />
            <div
              className={`w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60 ${compact ? 'h-44' : 'h-56'}`}
            />
          </div>
        ) : (
          <div>{children}</div>
        )}
      </div>
    </section>
  );
}
