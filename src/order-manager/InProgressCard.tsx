import { Clock3, User } from 'lucide-react';
import { useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUrgencyColor, remainingMinutes } from '../utils/urgency';
import { getCustomerDisplayName, type OrderManagerOrder } from './types';
import { OrderItemSummary } from './OrderItemSummary';

interface InProgressCardProps {
  order: OrderManagerOrder;
  nowMs: number;
  onReady: () => void;
  disabled?: boolean;
}

function formatCountdown(ms: number): string {
  const abs = Math.abs(ms);
  const totalSec = Math.floor(abs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${ms < 0 ? '-' : ''}${min}:${String(sec).padStart(2, '0')}`;
}

export function InProgressCard({ order, nowMs, onReady, disabled }: InProgressCardProps) {
  const { t } = useLanguage();
  const rem = remainingMinutes(order.estimated_ready_at ?? null, nowMs);
  const urgency = rem == null ? null : getUrgencyColor(rem);
  const msLeft = useMemo(() => {
    if (!order.estimated_ready_at) return null;
    return new Date(order.estimated_ready_at).getTime() - nowMs;
  }, [order.estimated_ready_at, nowMs]);
  const customerDisplay = getCustomerDisplayName(order);

  return (
    <article
      className={`neon-card rounded-xl border p-3 ${
        urgency ? `${urgency.border} ${urgency.bg} ${urgency.pulse ? 'animate-pulse' : ''}` : 'border-white/10'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-base font-bold text-white">#{order.display_number ?? '—'}</p>
        <span className="text-xs text-slate-300">₼{Number(order.total_price ?? 0).toFixed(2)}</span>
      </div>

      <div className="mt-2 inline-flex items-center gap-1 text-xs text-slate-300">
        <Clock3 className="h-3.5 w-3.5" />
        {msLeft == null ? '—' : formatCountdown(msLeft)}
      </div>

      {customerDisplay ? (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-300">
          <User className="h-3 w-3" />
          {t.woltCopyCustomer}: {customerDisplay}
        </p>
      ) : null}

      <div className="mt-2 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t.orderDetails}</p>
        <OrderItemSummary items={order.sale_items} compact />
      </div>

      <button
        type="button"
        onClick={onReady}
        disabled={disabled}
        className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {t.omMarkReady}
      </button>
    </article>
  );
}
