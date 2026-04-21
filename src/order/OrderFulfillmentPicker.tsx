import { ArrowLeftRight, Bike, Store } from 'lucide-react';
import type { OnlineFulfillmentType } from '../types/online';

interface OrderFulfillmentPickerProps {
  fulfillment: OnlineFulfillmentType;
  onChange: (f: OnlineFulfillmentType) => void;
  showTakeaway: boolean;
  showDelivery: boolean;
  label: string;
  takeawayLabel: string;
  deliveryLabel: string;
  variant?: 'default' | 'compact' | 'pill';
  /** When compact variant, hide eyebrow label (used inline in topbar). */
  showCompactLabel?: boolean;
}

/**
 * Takeaway vs delivery toggle.
 *
 * Variants:
 * - `default` — segmented control inside a card with eyebrow label.
 * - `compact` — segmented control only, with optional inline label.
 * - `pill` — single compact pill showing the active mode; click to swap.
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

  // Only one mode enabled — show as static chip (no toggle).
  if ((showTakeaway && !showDelivery) || (!showTakeaway && showDelivery)) {
    const onlyLabel = showTakeaway ? takeawayLabel : deliveryLabel;
    const Icon = showTakeaway ? Store : Bike;
    if (variant === 'pill') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-ming-ash">
          <Icon className="h-3.5 w-3.5 text-ming-red" />
          {onlyLabel}
        </span>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-ming-bone">
        <Icon className="h-4 w-4 text-ming-red" />
        {onlyLabel}
      </div>
    );
  }

  if (variant === 'pill') {
    // Compact pill for the top bar — swap modes on tap.
    const next: OnlineFulfillmentType = fulfillment === 'delivery' ? 'takeaway' : 'delivery';
    const activeLabel = fulfillment === 'delivery' ? deliveryLabel : takeawayLabel;
    const altLabel = fulfillment === 'delivery' ? takeawayLabel : deliveryLabel;
    const Icon = fulfillment === 'delivery' ? Bike : Store;
    return (
      <button
        type="button"
        onClick={() => onChange(next)}
        className="inline-flex min-w-0 items-center gap-1 rounded-full border border-ming-red/40 bg-ming-red/10 px-2 py-1.5 text-[11px] font-semibold text-ming-bone transition-colors hover:border-ming-red hover:bg-ming-red/20 sm:gap-1.5 sm:px-3 sm:text-[12px]"
        aria-label={label}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-ming-red" />
        <span className="truncate uppercase tracking-wide">{activeLabel}</span>
        <span aria-hidden className="hidden text-ming-ash sm:inline">·</span>
        <span
          aria-hidden
          className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-ming-red sm:inline"
        >
          {altLabel}?
        </span>
        <ArrowLeftRight
          aria-hidden
          className="h-3 w-3 shrink-0 text-ming-red/80 sm:hidden"
        />
      </button>
    );
  }

  const segmented = (
    <div className="ming-segmented w-full">
      <button
        type="button"
        onClick={() => onChange('takeaway')}
        className={`ming-segmented-btn flex-1 justify-center ${
          fulfillment === 'takeaway' ? 'ming-segmented-btn-active' : ''
        }`}
      >
        <Store className="h-4 w-4" />
        {takeawayLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange('delivery')}
        className={`ming-segmented-btn flex-1 justify-center ${
          fulfillment === 'delivery' ? 'ming-segmented-btn-active' : ''
        }`}
      >
        <Bike className="h-4 w-4" />
        {deliveryLabel}
      </button>
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className="w-full py-1">
        {showCompactLabel ? <p className="ming-label mb-2">{label}</p> : <p className="sr-only">{label}</p>}
        {segmented}
      </div>
    );
  }

  return (
    <div className="ming-card p-3 sm:p-4">
      <p className="ming-label mb-2.5">{label}</p>
      {segmented}
    </div>
  );
}
