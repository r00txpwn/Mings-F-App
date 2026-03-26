import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
}

export function ChartCard({ title, actions, children, loading = false }: ChartCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-sm dark:border-violet-400/20 dark:bg-slate-900/60 dark:shadow-neon-soft">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/5">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {title}
        </h3>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="p-4">
        {loading ? (
          <div className="space-y-2">
            <div className="h-5 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700/80" />
            <div className="h-56 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/60" />
          </div>
        ) : (
          <div>{children}</div>
        )}
      </div>
    </section>
  );
}
