import type { ComponentType, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ComponentType<{ className?: string }>;
  /** Right-aligned actions (e.g. primary CTA) on larger screens */
  actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="neon-card mb-8 p-5 sm:p-6">
      {eyebrow ? <p className="cockpit-eyebrow">{eyebrow}</p> : null}
      <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          {Icon ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-neon-soft">
              <Icon className="h-6 w-6 text-white" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h1 className="cockpit-page-title">{title}</h1>
            {description ? <p className="cockpit-page-sub max-w-2xl">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div> : null}
      </div>
    </div>
  );
}
