import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  large?: boolean;
}

export function Input({ label, large = false, className = '', id, ...props }: InputProps) {
  const inputId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
  const inputClass = large ? 'cockpit-input-lg' : 'cockpit-input';

  return (
    <div>
      {label ? (
        <label htmlFor={inputId} className="cockpit-label">
          {label}
        </label>
      ) : null}
      <input id={inputId} className={`${inputClass} ${className}`.trim()} {...props} />
    </div>
  );
}
