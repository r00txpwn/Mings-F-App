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

export function isCashPickupMethod(method: string | null | undefined, saleSource: string | undefined): boolean {
  const v = String(method ?? '').trim().toLowerCase();
  if (v === 'cash_pickup') return true;
  if (v === 'cash' || v === 'cod') return saleSource === 'online_takeaway';
  return false;
}

export function isCashDeliveryMethod(method: string | null | undefined, saleSource: string | undefined): boolean {
  const v = String(method ?? '').trim().toLowerCase();
  if (v === 'cash_delivery') return true;
  if (v === 'cash' || v === 'cod') return saleSource === 'online_delivery';
  return false;
}

/** Whether KDS may move an order to preparing (matches OrderCard / order-manager policy). */
export function paymentConfirmedForKdsPrep(params: {
  source: string | null | undefined;
  onlinePaymentMethod: string | null | undefined;
  paymentStatus: string | null | undefined;
}): boolean {
  const pay = String(params.paymentStatus ?? '').trim().toLowerCase();
  const source = String(params.source ?? '').trim().toLowerCase();
  const online = source === 'online_delivery' || source === 'online_takeaway';
  const method = params.onlinePaymentMethod;

  if (source === 'kiosk') return pay === 'paid';

  if (online) {
    if (isCardOnlinePaymentMethod(method)) return pay === 'paid';
    if (isCashPickupMethod(method, source) || isCashDeliveryMethod(method, source)) {
      return pay === 'unpaid' || pay === 'pending' || pay === 'paid';
    }
    return pay === 'paid';
  }

  return pay === 'paid' || pay === 'completed';
}
