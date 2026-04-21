import { ExternalLink, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getCustomerDisplayName, type OrderManagerOrder } from './types';
import { OrderItemSummary } from './OrderItemSummary';

interface InDeliveryCardProps {
  order: OrderManagerOrder;
  onDelivered: () => void;
}

export function InDeliveryCard({ order, onDelivered }: InDeliveryCardProps) {
  const { t } = useLanguage();
  const trackingUrl = order.delivery_order?.tracking_url ?? '';
  const customerDisplay = getCustomerDisplayName(order);

  return (
    <article className="neon-card rounded-xl border border-sky-500/35 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-base font-bold text-white">#{order.display_number ?? '—'}</p>
        <span className="text-xs text-slate-300">₼{Number(order.total_price ?? 0).toFixed(2)}</span>
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
