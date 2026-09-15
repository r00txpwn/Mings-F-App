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
 * Takeaway vs delivery toggle — Chipotle-style segmented control (storefront header).
 */
export function OrderFulfillmentPicker({
  fulfillment,
  onChange,
  showTakeaway,
  showDelivery,
  label,
  takeawayLabel,
  deliveryLabel,
}: OrderFulfillmentPickerProps) {
  if (!showTakeaway && !showDelivery) return null;

  if ((showTakeaway && !showDelivery) || (!showTakeaway && showDelivery)) {
    const onlyLabel = showTakeaway ? takeawayLabel : deliveryLabel;
    return (
      <div className="sf-fulfillment" role="group" aria-label={label}>
        <button type="button" aria-pressed="true" disabled>
          {onlyLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="sf-fulfillment" role="group" aria-label={label}>
      <button
        type="button"
        aria-pressed={fulfillment === 'takeaway'}
        onClick={() => onChange('takeaway')}
      >
        {takeawayLabel}
      </button>
      <button
        type="button"
        aria-pressed={fulfillment === 'delivery'}
        onClick={() => onChange('delivery')}
      >
        {deliveryLabel}
      </button>
    </div>
  );
}
