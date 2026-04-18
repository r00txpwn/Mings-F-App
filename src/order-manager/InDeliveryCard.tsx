import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { OrderManagerOrder } from './types';

interface InDeliveryCardProps {
  order: OrderManagerOrder;
  onDelivered: () => void;
}

export function InDeliveryCard({ order, onDelivered }: InDeliveryCardProps) {
  const { t } = useLanguage();
  const trackingUrl = order.delivery_order?.tracking_url ?? '';

  return (
    <article className="neon-card rounded-xl border border-sky-500/35 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-base font-bold text-white">#{order.display_number ?? '—'}</p>
        <span className="text-xs text-slate-300">₼{Number(order.total_price ?? 0).toFixed(2)}</span>
      </div>

      <ul className="mt-2 space-y-0.5 text-xs text-slate-300">
        {(order.sale_items ?? []).slice(0, 3).map((item) => (
          <li key={item.id}>
            {item.quantity}x {item.product_name}
          </li>
        ))}
      </ul>

      {trackingUrl ? (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-cockpit-300 hover:text-cockpit-200"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t.trackOnWolt}
        </a>
      ) : null}

      <button
        type="button"
        onClick={onDelivered}
        className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
      >
        {t.omDelivered}
      </button>
    </article>
  );
}
