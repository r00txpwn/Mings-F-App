import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'cockpit-btn-primary',
  secondary: 'neon-btn-secondary',
  ghost: 'cockpit-btn-ghost',
  danger:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: '',
  lg: 'px-5 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const sizeOverride = size !== 'md' ? sizeClass[size] : '';
  return (
    <button type={type} className={`${variantClass[variant]} ${sizeOverride} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
