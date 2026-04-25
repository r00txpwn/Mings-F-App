/**
 * Canonical persisted values for NEW online orders (see online-order-create).
 * Legacy rows may still have epoint, cod, or cash.
 */
export type PersistedOnlinePaymentMethod = 'card_online' | 'cash_pickup' | 'cash_delivery';

/**
 * Server-authoritative normalization — keep in sync with
 * `supabase/functions/_shared/onlinePaymentMethod.ts`.
 */
export function normalizePaymentMethodForPersist(
  raw: string | undefined | null,
  fulfillmentType: 'takeaway' | 'delivery'
): PersistedOnlinePaymentMethod {
  const m = String(raw ?? 'cod').trim().toLowerCase();
  if (m === 'epoint' || m === 'card_online') return 'card_online';
  // Cash-like values are derived from fulfillment so impossible pairs
  // such as delivery + cash_pickup cannot be persisted for new orders.
  return fulfillmentType === 'takeaway' ? 'cash_pickup' : 'cash_delivery';
}

/** Card / online gateway path (EPoint today; provider-agnostic label). */
export function isCardOnlinePaymentMethod(method: string | null | undefined): boolean {
  const v = String(method ?? '').trim().toLowerCase();
  return v === 'epoint' || v === 'card_online';
}

/** Cash at counter (explicit or legacy cod/cash on takeaway). */
export function isCashPickupMethod(method: string | null | undefined, saleSource: string | undefined): boolean {
  const v = String(method ?? '').trim().toLowerCase();
  if (v === 'cash_pickup') return true;
  if (v === 'cash' || v === 'cod') return saleSource === 'online_takeaway';
  return false;
}

/** Cash on delivery (explicit or legacy cod/cash on delivery). */
export function isCashDeliveryMethod(method: string | null | undefined, saleSource: string | undefined): boolean {
  const v = String(method ?? '').trim().toLowerCase();
  if (v === 'cash_delivery') return true;
  if (v === 'cash' || v === 'cod') return saleSource === 'online_delivery';
  return false;
}

/** Kiosk / online: treat cash-like methods as “no card rail” for prep policy. */
export function isCashLikeOnlineMethod(method: string | null | undefined, saleSource: string | undefined): boolean {
  return isCashPickupMethod(method, saleSource) || isCashDeliveryMethod(method, saleSource);
}
