import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface KdsEmptyStateProps {
  title: string;
  hint?: string;
  compact?: boolean;
  icon?: ReactNode;
}

export function KdsEmptyState({ title, hint, compact = false, icon }: KdsEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-10 px-4' : 'py-16 px-6'
      }`}
    >
      <div
        className={`mb-3 flex items-center justify-center rounded-2xl border border-violet-500/15 bg-slate-800/40 text-violet-300/70 ${
          compact ? 'h-12 w-12' : 'h-16 w-16'
        }`}
      >
        {icon ?? <Inbox className={compact ? 'h-5 w-5' : 'h-7 w-7'} strokeWidth={1.5} />}
      </div>
      <p className={`font-medium text-slate-300 ${compact ? 'text-sm' : 'text-base'}`}>{title}</p>
      {hint ? (
        <p className={`mt-1 max-w-[220px] leading-relaxed text-slate-500 ${compact ? 'text-xs' : 'text-sm'}`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
