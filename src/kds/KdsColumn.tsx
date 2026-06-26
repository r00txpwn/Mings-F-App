import type { ReactNode } from 'react';

export type KdsColumnVariant = 'pending' | 'preparing' | 'ready';

interface KdsColumnProps {
  title: string;
  count: number;
  variant: KdsColumnVariant;
  children: ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<
  KdsColumnVariant,
  { header: string; border: string; badge: string; glow: string }
> = {
  pending: {
    header: 'from-violet-600/90 to-violet-700/90 text-white',
    border: 'border-violet-500/25',
    badge: 'bg-violet-400/20 text-violet-100',
    glow: 'shadow-[inset_0_1px_0_0_rgba(167,139,250,0.15)]',
  },
  preparing: {
    header: 'from-cyan-600/90 to-cyan-700/90 text-white',
    border: 'border-cyan-500/25',
    badge: 'bg-cyan-400/20 text-cyan-100',
    glow: 'shadow-[inset_0_1px_0_0_rgba(34,211,238,0.15)]',
  },
  ready: {
    header: 'from-emerald-600/90 to-emerald-700/90 text-white',
    border: 'border-emerald-500/25',
    badge: 'bg-emerald-400/20 text-emerald-100',
    glow: 'shadow-[inset_0_1px_0_0_rgba(52,211,153,0.15)]',
  },
};

export function KdsColumn({ title, count, variant, children, className = '' }: KdsColumnProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <section
      className={`flex min-h-0 min-w-[min(100%,360px)] flex-1 flex-col overflow-hidden rounded-2xl border bg-slate-900/50 backdrop-blur-sm ${styles.border} ${styles.glow} ${className}`}
    >
      <header
        className={`flex shrink-0 items-center justify-between bg-gradient-to-r px-4 py-3 ${styles.header}`}
      >
        <h2 className="text-xs font-bold uppercase tracking-[0.14em]">{title}</h2>
        <span
          className={`min-w-[1.75rem] rounded-full px-2 py-0.5 text-center text-xs font-bold tabular-nums ${styles.badge}`}
        >
          {count}
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain p-3 [&>article]:shrink-0">
        {children}
      </div>
    </section>
  );
}
