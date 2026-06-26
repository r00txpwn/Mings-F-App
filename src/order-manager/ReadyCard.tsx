import { Bike, ClipboardCopy, MapPin, Navigation, Phone, Truck, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  SELF_DELIVERY_THRESHOLD_KM,
  formatDistanceKm,
  suggestDeliveryMethod,
  type KitchenLocation,
} from './deliveryUtils';
import { getCustomerDisplayName, type OrderManagerOrder } from './types';
import { OrderItemSummary } from './OrderItemSummary';

interface ReadyCardProps {
  order: OrderManagerOrder;
  kitchenLocation: KitchenLocation;
  onPickedUp: () => void;
  onDispatched: () => void;
  onSelfDispatch: (orderId: string) => void;
}

export function ReadyCard({ order, kitchenLocation, onPickedUp, onDispatched, onSelfDispatch }: ReadyCardProps) {
  const { t } = useLanguage();
  const [dispatchMethod, setDispatchMethod] = useState<'self' | 'wolt' | null>(null);
  const [dispatchConfirmed, setDispatchConfirmed] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDelivery = order.source === 'online_delivery';

  const sourceLabel = useMemo(() => {
    if (order.source === 'online_delivery') return t.omSourceDelivery;
    if (order.source === 'online_takeaway') return t.omSourceTakeaway;
    return t.omSourceKiosk;
  }, [order.source, t]);
  const customerDisplay = getCustomerDisplayName(order);
  const suggestion = suggestDeliveryMethod(order.delivery_lat, order.delivery_lng, kitchenLocation);
  const distanceLabel = formatDistanceKm(order.delivery_lat, order.delivery_lng, kitchenLocation);
  const activeMethod = dispatchMethod ?? suggestion;

  // Keep this prop wired for future Wolt integration.
  void onDispatched;

  const handleSelfDispatch = () => {
    onSelfDispatch(order.id);
    setDispatchConfirmed(true);
  };

  const handleCopy = async () => {
    try {
      const payload = [
        `${t.woltCopyCustomer}: ${order.customer_name ?? '-'}`,
        `${t.woltCopyPhone}: ${order.customer_phone ?? '-'}`,
        `${t.woltCopyAddress}: ${order.delivery_address ?? '-'}`,
        `${t.woltCopyNotes}: ${order.delivery_notes ?? order.notes ?? '-'}`,
      ].join('\n');
      await navigator.clipboard.writeText(payload);
      setCopyFlash(true);
      window.setTimeout(() => setCopyFlash(false), 1500);
    } catch {
      setError(t.woltCopyFailed);
    }
  };

  return (
    <article className="neon-card rounded-xl border border-emerald-500/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-base font-bold text-white">#{order.display_number ?? '—'}</p>
        <span className="text-xs text-emerald-200">{sourceLabel}</span>
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

      {!isDelivery ? (
        <button
          type="button"
          onClick={onPickedUp}
          className="mt-3 w-full rounded-lg bg-cockpit-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cockpit-500"
        >
          {t.omPickedUp}
        </button>
      ) : (
        <div className="mt-3 space-y-3 rounded-lg border border-white/10 p-2">
          <div className="space-y-1">
            {distanceLabel ? (
              <p className="inline-flex items-center gap-1 text-xs text-slate-300">
                <Navigation className="h-3 w-3" />
                {distanceLabel} {t.omDistanceAway}
              </p>
            ) : null}
            {suggestion === 'self' ? (
              <p className="text-xs font-semibold text-emerald-300">
                {t.omSelfDelivery} {t.omRecommended}
              </p>
            ) : null}
            {suggestion === 'wolt' ? (
              <p className="text-xs font-semibold text-blue-300">
                {t.omWoltDrive} {t.omRecommended}
              </p>
            ) : null}
            {suggestion == null ? <p className="text-xs font-semibold text-amber-300">{t.omNoLocationData}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDispatchMethod('self')}
              className={`rounded-lg border px-3 py-2 text-left ${
                activeMethod === 'self'
                  ? 'border-emerald-500 bg-emerald-600 text-white'
                  : 'border-white/10 bg-white/5 text-slate-400'
              }`}
            >
              <span className="inline-flex items-center gap-1 text-sm font-semibold">
                <Bike className="h-4 w-4" />
                {t.omSelfDelivery}
              </span>
              <span className="mt-1 block text-[11px] opacity-80">
                Under {SELF_DELIVERY_THRESHOLD_KM.toFixed(0)} km
              </span>
            </button>

            <button
              type="button"
              disabled
              className="relative cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-slate-500 opacity-50"
            >
              <span className="inline-flex items-center gap-1 text-sm font-semibold">
                <Truck className="h-4 w-4" />
                {t.omWoltDrive}
              </span>
              <span className="mt-1 block text-[11px]">{t.omWoltDriveComingSoon}</span>
              <span className="absolute right-2 top-2 rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-200">
                {t.omWoltDriveComingSoon}
              </span>
            </button>
          </div>

          {order.delivery_address ? (
            <p className="inline-flex items-start gap-1 text-xs text-blue-200">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{order.delivery_address}</span>
            </p>
          ) : null}

          {order.customer_phone ? (
            <p className="inline-flex items-center gap-1 text-xs text-slate-300">
              <Phone className="h-3.5 w-3.5" />
              {order.customer_phone}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <ClipboardCopy className="h-3.5 w-3.5" />
            {copyFlash ? t.woltCopiedAll : t.woltCopyAll}
          </button>

          {activeMethod === 'self' ? (
            <>
              {!dispatchConfirmed ? (
                <button
                  type="button"
                  onClick={handleSelfDispatch}
                  className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  {t.omConfirmSelfDispatch}
                </button>
              ) : (
                <>
                  <p className="text-sm font-semibold text-emerald-300">{t.omDispatchedSelfDelivery}</p>
                  <button
                    type="button"
                    onClick={onPickedUp}
                    className="w-full rounded-lg bg-cockpit-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cockpit-500"
                  >
                    {t.omPickedUp}
                  </button>
                </>
              )}
            </>
          ) : null}

          {error ? <p className="text-[11px] text-rose-300">{error}</p> : null}
        </div>
      )}
    </article>
  );
}
