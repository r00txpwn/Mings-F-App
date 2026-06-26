import type { ComponentType, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ComponentType<{ className?: string }>;
  /** Right-aligned actions (e.g. primary CTA) — only visible part of the header */
  actions?: ReactNode;
}

/**
 * Compact page chrome: no card, no duplicate title block (sidebar already shows nav).
 * Keeps action buttons and screen-reader page context.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <>
      <h1 className="sr-only">{title}</h1>
      {description ? <p className="sr-only">{description}</p> : null}
      {actions ? (
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">{actions}</div>
      ) : null}
    </>
  );
}
