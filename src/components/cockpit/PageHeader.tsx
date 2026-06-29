import type { ComponentType, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ComponentType<{ className?: string }>;
  /** Right-aligned primary/secondary actions */
  actions?: ReactNode;
}

/**
 * Standard cockpit page chrome: visible title block + predictable action slot.
 * Page order: header → filters → summary → content → empty/loading/error.
 */
export function PageHeader({ title, description, eyebrow, icon: Icon, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="cockpit-eyebrow mb-1">{eyebrow}</p>
        ) : null}
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cockpit-50 text-cockpit-600 dark:bg-cockpit-950/50 dark:text-cockpit-400">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="cockpit-page-title text-2xl sm:text-3xl">{title}</h1>
            {description ? <p className="cockpit-page-sub mt-1">{description}</p> : null}
          </div>
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
