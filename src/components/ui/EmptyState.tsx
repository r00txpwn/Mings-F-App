import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900/40 ${className}`}
    >
      {Icon ? <Icon className="mb-3 h-10 w-10 text-slate-400 dark:text-slate-500" aria-hidden /> : null}
      <p className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
