import { CalendarClock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { OrderManagerOrder } from './types';

const REMINDER_OPTIONS = [5, 10, 15, 20, 30] as const;

interface ScheduledOrderCardProps {
  order: OrderManagerOrder;
  onAccept: (reminderMinutes: number) => void;
  disabled?: boolean;
}

export function ScheduledOrderCard({ order, onAccept, disabled }: ScheduledOrderCardProps) {
  const { t } = useLanguage();
  const [reminderMinutes, setReminderMinutes] = useState<number>(10);
  const scheduleLabel = useMemo(() => {
    if (!order.scheduled_for) return '—';
    return new Date(order.scheduled_for).toLocaleString();
  }, [order.scheduled_for]);
  const reminderLabel = useMemo(() => {
    if (!order.reminder_at) return null;
    return new Date(order.reminder_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [order.reminder_at]);

  return (
    <article className="neon-card rounded-xl border border-cockpit-500/25 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-base font-bold text-white">#{order.display_number ?? '—'}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-cockpit-300">
            <CalendarClock className="h-3.5 w-3.5" />
            {scheduleLabel}
          </p>
        </div>
        <span className="text-xs text-slate-400">₼{Number(order.total_price ?? 0).toFixed(2)}</span>
      </div>

      <ul className="mt-2 space-y-0.5 text-xs text-slate-300">
        {(order.sale_items ?? []).slice(0, 3).map((item) => (
          <li key={item.id}>
            {item.quantity}x {item.product_name}
          </li>
        ))}
      </ul>

      {reminderLabel ? (
        <p className="text-[11px] text-cockpit-300">
          {t.omReminderSet}: {reminderLabel}
        </p>
      ) : null}

      <div className="mt-2">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t.omReminderBefore}</p>
        <div className="flex flex-wrap gap-1.5">
          {REMINDER_OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setReminderMinutes(v)}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                reminderMinutes === v
                  ? 'bg-cockpit-500 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {v}m
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAccept(reminderMinutes)}
        disabled={disabled}
        className="neon-btn-primary mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {t.omAccept}
      </button>
    </article>
  );
}
