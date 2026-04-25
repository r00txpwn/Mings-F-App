/**
 * Canonical persisted values for NEW online orders.
 * Must match `src/lib/onlinePaymentMethod.ts` normalization logic.
 */
export type PersistedOnlinePaymentMethod = 'card_online' | 'cash_pickup' | 'cash_delivery';

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

export function isCardOnlinePaymentMethod(method: string | null | undefined): boolean {
  const v = String(method ?? '').trim().toLowerCase();
  return v === 'epoint' || v === 'card_online';
}
