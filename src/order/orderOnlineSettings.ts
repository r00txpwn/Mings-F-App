import type { OnlineSettingsRow } from '../types/online';

/**
 * Coerce booleans from PostgREST / JSON (sometimes strings in edge cases).
 * Missing / null → default `true` so new or partial `online_settings` rows still show both modes.
 */
export function readOnlineBool(value: unknown, whenMissing: boolean): boolean {
  if (value === undefined || value === null) return whenMissing;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true', 't', '1', 'yes'].includes(v)) return true;
    if (['false', 'f', '0', 'no'].includes(v)) return false;
  }
  if (typeof value === 'number') return value !== 0;
  return whenMissing;
}

/**
 * Whether the storefront should show Pickup + Delivery as two tappable options.
 *
 * By default we **always** show both so customers can choose (many DB seeds had
 * `delivery_enabled = false`, which hid the delivery control entirely).
 *
 * Set `VITE_ORDER_HIDE_DELIVERY_UI=true` to show pickup-only (e.g. takeaway-only brand site).
 * Checkout / Edge Functions still enforce `online_settings.delivery_enabled` for real orders.
 */
export function getOnlineFulfillmentVisibility(settings: OnlineSettingsRow | null): {
  showTakeaway: boolean;
  showDelivery: boolean;
} {
  const hideDeliveryUi =
    import.meta.env.VITE_ORDER_HIDE_DELIVERY_UI === 'true' ||
    import.meta.env.VITE_ORDER_HIDE_DELIVERY_UI === '1';

  return {
    showTakeaway: readOnlineBool(settings?.takeaway_enabled, true),
    showDelivery: hideDeliveryUi ? false : true,
  };
}

/** Server-side: can we actually accept a delivery order (Edge uses this). */
export function isDeliveryEnabledInSettings(settings: OnlineSettingsRow | null | undefined): boolean {
  return readOnlineBool(settings?.delivery_enabled, true);
}

/** Best-effort label from `hours_json` for the venue card (shape varies by tenant). */
export function formatVenueHoursLine(
  hours: Record<string, unknown> | undefined | null
): string | null {
  if (!hours || typeof hours !== 'object') return null;
  const o = hours as Record<string, unknown>;
  const open = o.open ?? o.from ?? o.weekday_open ?? o.weekdays_open;
  const close = o.close ?? o.to ?? o.weekday_close ?? o.weekdays_close;
  if (typeof open === 'string' && typeof close === 'string') return `${open} – ${close}`;
  const single = o.display ?? o.label ?? o.text;
  if (typeof single === 'string' && single.trim()) return single.trim();
  return null;
}
