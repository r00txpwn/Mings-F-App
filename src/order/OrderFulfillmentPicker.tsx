import type { OnlineFulfillmentType } from '../types/online';

interface OrderFulfillmentPickerProps {
  fulfillment: OnlineFulfillmentType;
  onChange: (f: OnlineFulfillmentType) => void;
  showTakeaway: boolean;
  showDelivery: boolean;
  label: string;
  takeawayLabel: string;
  deliveryLabel: string;
  variant?: 'default' | 'compact';
  /** When `variant` is compact, show the title above buttons (e.g. cart strip). Hide in hero cards that already have a title. */
  showCompactLabel?: boolean;
}

/**
 * Takeaway vs delivery — show when both modes are enabled in `online_settings`.
 */
export function OrderFulfillmentPicker({
  fulfillment,
  onChange,
  showTakeaway,
  showDelivery,
  label,
  takeawayLabel,
  deliveryLabel,
  variant = 'default',
  showCompactLabel = true,
}: OrderFulfillmentPickerProps) {
  if (!showTakeaway && !showDelivery) return null;
  if (showTakeaway && !showDelivery) {
    return (
      <p className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-center text-sm text-slate-400">
        {takeawayLabel}
      </p>
    );
  }
  if (!showTakeaway && showDelivery) {
    return (
      <p className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-center text-sm text-slate-400">
        {deliveryLabel}
      </p>
    );
  }

  const buttons = (
    <div className="flex gap-2">
      <button
        type="button"
        className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${
          fulfillment === 'takeaway' ? 'bg-cockpit-600 text-white shadow-lg' : 'bg-white/5 text-slate-300 hover:bg-white/10'
        }`}
        onClick={() => onChange('takeaway')}
      >
        {takeawayLabel}
      </button>
      <button
        type="button"
        className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${
          fulfillment === 'delivery' ? 'bg-cockpit-600 text-white shadow-lg' : 'bg-white/5 text-slate-300 hover:bg-white/10'
        }`}
        onClick={() => onChange('delivery')}
      >
        {deliveryLabel}
      </button>
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className="w-full py-1">
        {showCompactLabel ? (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
        ) : (
          <p className="sr-only">{label}</p>
        )}
        {buttons}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 shadow-inner">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {buttons}
    </div>
  );
}
