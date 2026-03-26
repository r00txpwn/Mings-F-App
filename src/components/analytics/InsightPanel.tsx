import type { ReactNode } from 'react';

interface InsightPanelProps {
  title: string;
  children: ReactNode;
  severity?: 'info' | 'warning' | 'critical' | 'success';
}

function getSeverityStyles(severity: InsightPanelProps['severity']) {
  if (severity === 'warning') {
    return 'border-amber-500/40 bg-amber-500/5 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100';
  }
  if (severity === 'critical') {
    return 'border-rose-500/40 bg-rose-500/5 text-rose-950 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100';
  }
  if (severity === 'success') {
    return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100';
  }
  return 'border-cockpit-500/35 bg-cockpit-500/5 text-slate-900 dark:border-cockpit-500/25 dark:bg-cockpit-950/40 dark:text-cockpit-100';
}

export function InsightPanel({ title, children, severity = 'info' }: InsightPanelProps) {
  return (
    <section
      className={`rounded-2xl border p-4 shadow-sm backdrop-blur-sm dark:shadow-neon-soft ${getSeverityStyles(severity)}`}
    >
      <h3 className="text-xs font-bold uppercase tracking-[0.12em] opacity-90">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed">{children}</div>
    </section>
  );
}
