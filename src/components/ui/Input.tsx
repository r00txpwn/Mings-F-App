import type { InputHTMLAttributes } from 'react';
import { Input as ShadInput } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  large?: boolean;
}

export function Input({ label, large = false, className = '', id, ...props }: InputProps) {
  const inputId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);

  return (
    <div className="space-y-2">
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}
      <ShadInput
        id={inputId}
        className={cn(large && 'h-11 text-base font-mono tabular-nums', className)}
        {...props}
      />
    </div>
  );
}
