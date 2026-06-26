import type { ReactNode, SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
  compact?: boolean;
}

export function Select({ label, children, compact = false, className = '', id, ...props }: SelectProps) {
  const selectId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const selectClass = compact ? 'cockpit-select-compact' : 'cockpit-select';

  return (
    <div>
      {label ? (
        <label htmlFor={selectId} className="cockpit-label">
          {label}
        </label>
      ) : null}
      <select id={selectId} className={`${selectClass} ${className}`.trim()} {...props}>
        {children}
      </select>
    </div>
  );
}
