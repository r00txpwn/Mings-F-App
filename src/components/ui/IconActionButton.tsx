import type { ReactNode } from 'react';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';

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
  neutral: 'text-muted-foreground hover:text-foreground',
  edit: 'text-violet-600 hover:text-violet-700 dark:text-violet-400',
  danger: 'text-destructive hover:text-destructive/90',
  success: 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400',
  info: 'text-primary hover:text-primary/90',
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
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      title={title ?? label}
      aria-label={label ?? title}
      disabled={disabled}
      className={cn('h-9 w-9', toneClasses[tone], className)}
    >
      {icon}
    </Button>
  );
}
