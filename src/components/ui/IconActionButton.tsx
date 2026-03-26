import type { ReactNode } from 'react';

type IconTone = 'neutral' | 'edit' | 'danger' | 'success' | 'info';

interface IconActionButtonProps {
  onClick?: () => void;
  icon: ReactNode;
  label?: string;
  title?: string;
  tone?: IconTone;
  disabled?: boolean;
  className?: string;
}

const toneClasses: Record<IconTone, string> = {
  neutral: 'text-slate-500 hover:bg-slate-500/10 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200',
  edit: 'text-violet-600 hover:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/15',
  danger: 'text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/15',
  success: 'text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/15',
  info: 'text-cockpit-700 hover:bg-cockpit-500/10 dark:text-cockpit-300 dark:hover:bg-cockpit-500/15',
};

export function IconActionButton({
  onClick,
  icon,
  label,
  title,
  tone = 'neutral',
  disabled = false,
  className = '',
}: IconActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      aria-label={label ?? title}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${toneClasses[tone]} ${className}`.trim()}
    >
      {icon}
    </button>
  );
}

