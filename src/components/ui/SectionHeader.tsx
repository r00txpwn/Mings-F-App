import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, actions, className = '' }: SectionHeaderProps) {
  return (
    <div className={`mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}>
      <div>
        <h2 className="cockpit-section-title text-sm font-semibold normal-case tracking-normal text-slate-900 dark:text-white">
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
