import { Phone, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { OrderManagerOrder } from './types';

const PREP_OPTIONS = [5, 10, 15, 20, 25, 30] as const;

interface NewOrderCardProps {
  order: OrderManagerOrder;
  onAccept: (prepMinutes: number) => void;
  onMarkPaid: () => void;
  disabled?: boolean;
}

export function NewOrderCard({ order, onAccept, onMarkPaid, disabled }: NewOrderCardProps) {
  const { t } = useLanguage();
  const [prepMinutes, setPrepMinutes] = useState<number>(5);
  const isPendingOnlinePayment =
    (order.source === 'online_delivery' || order.source === 'online_takeaway') &&
    order.online_payment_method === 'epoint' &&
    order.payment_status !== 'paid' &&
    order.payment_status !== 'completed';

  const sourceLabel = useMemo(() => {
    if (order.source === 'online_delivery') return t.omSourceDelivery;
    if (order.source === 'online_takeaway') return t.omSourceTakeaway;
    return t.omSourceKiosk;
  }, [order.source, t]);

  return (
    <article className="neon-card flex flex-col gap-2 rounded-xl border border-white/10 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-base font-bold text-white">#{order.display_number ?? '—'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-cockpit-500/15 px-2 py-0.5 text-[10px] font-semibold text-cockpit-300">
              {sourceLabel}
            </span>
            <span className="text-xs text-slate-400">₼{Number(order.total_price ?? 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <ul className="space-y-0.5 text-xs text-slate-300">
        {(order.sale_items ?? []).slice(0, 3).map((item) => (
          <li key={item.id}>
            {item.quantity}x {item.product_name}
          </li>
        ))}
        {(order.sale_items ?? []).length > 3 ? (
          <li className="text-slate-500">+{(order.sale_items ?? []).length - 3} {t.items}</li>
        ) : null}
      </ul>

      {order.customer_phone ? (
        <p className="inline-flex items-center gap-1 text-xs text-slate-400">
          <Phone className="h-3 w-3" />
          {order.customer_phone}
        </p>
      ) : null}
      {order.delivery_address ? (
        <p className="inline-flex items-start gap-1 text-xs text-slate-400">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{order.delivery_address}</span>
        </p>
      ) : null}

      <div className="mt-1">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t.omPrepTime}</p>
        <div className="flex flex-wrap gap-1.5">
          {PREP_OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setPrepMinutes(v)}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                prepMinutes === v
                  ? 'bg-cockpit-500 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {isPendingOnlinePayment ? (
        <button
          type="button"
          onClick={onMarkPaid}
          disabled={disabled}
          className="mt-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 disabled:opacity-60"
        >
          {t.confirmPayment}
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => onAccept(prepMinutes)}
        disabled={disabled || isPendingOnlinePayment}
        className="neon-btn-primary mt-1 rounded-lg px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t.omAccept}
      </button>
    </article>
  );
}
