import { Bike, Clock, Store } from 'lucide-react';
import type { OnlineFulfillmentType } from '../types/online';
import { OrderFulfillmentPicker } from './OrderFulfillmentPicker';

interface OrderFulfillmentHeroCardProps {
  fulfillment: OnlineFulfillmentType;
  onChange: (f: OnlineFulfillmentType) => void;
  showTakeaway: boolean;
  showDelivery: boolean;
  label: string;
  takeawayLabel: string;
  deliveryLabel: string;
  hoursLine: string | null;
}

export function OrderFulfillmentHeroCard({
  fulfillment,
  onChange,
  showTakeaway,
  showDelivery,
  label,
  takeawayLabel,
  deliveryLabel,
  hoursLine,
}: OrderFulfillmentHeroCardProps) {
  const activeIcon =
    fulfillment === 'delivery' ? (
      <Bike className="h-6 w-6 text-amber-400" aria-hidden />
    ) : (
      <Store className="h-6 w-6 text-cockpit-400" aria-hidden />
    );
  const activeTitle = fulfillment === 'delivery' ? deliveryLabel : takeawayLabel;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/95 via-slate-900/90 to-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_-24px_rgba(0,0,0,0.85)]">
      <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-cockpit-600/15 blur-3xl" />

      <div className="relative p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 shadow-inner">
            {activeIcon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <p className="truncate text-lg font-semibold tracking-tight text-white">{activeTitle}</p>
            {hoursLine ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                {hoursLine}
              </p>
            ) : null}
          </div>
        </div>

        <OrderFulfillmentPicker
          fulfillment={fulfillment}
          onChange={onChange}
          showTakeaway={showTakeaway}
          showDelivery={showDelivery}
          label={label}
          takeawayLabel={takeawayLabel}
          deliveryLabel={deliveryLabel}
          variant="compact"
          showCompactLabel={false}
        />
      </div>
    </div>
  );
}
