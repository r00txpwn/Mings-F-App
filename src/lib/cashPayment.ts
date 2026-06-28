/**
 * Cash detection for the cash-drawer / reconciliation feature.
 *
 * A payment counts as physical cash if its method is an explicit cash value
 * (POS / manual: 'cash'), a cash-on-delivery / cash-at-pickup online value, or
 * a localized "cash" word that staff may have typed into the free-text
 * payment_method fields on expenses / supplier payments / liability payments.
 */

const CASH_TOKENS = [
  'cash',
  'cash_pickup',
  'cash_delivery',
  'cod',
  'nağd', // az
  'nagd',
  'наличные', // ru
  'наличными',
  'налич',
];

export function isCashPaymentMethod(method: string | null | undefined): boolean {
  const v = String(method ?? '').trim().toLowerCase();
  if (!v) return false;
  return CASH_TOKENS.some((token) => v === token || v.includes(token));
}

/** Canonical value to persist for an in-person cash sale. */
export const CASH_PAYMENT_METHOD = 'cash';
/** Canonical value to persist for an in-person card sale. */
export const CARD_PAYMENT_METHOD = 'card';
/** Canonical value for bank-transfer expenses / payments. */
export const BANK_TRANSFER_PAYMENT_METHOD = 'bank_transfer';

export type FinanceAccountKey = 'cash' | 'bank' | 'card';

const BANK_TRANSFER_TOKENS = [
  'bank_transfer',
  'bank transfer',
  'bank-transfer',
  'wire',
  'transfer',
  'köçürmə', // az
  'kocurme',
  'перевод', // ru
  'банковский',
];

const CARD_TOKENS = [
  'card',
  'card_online',
  'epoint',
  'debit',
  'credit',
  'kart', // az
  'карт', // ru
];

function normalizePaymentMethod(method: string | null | undefined): string {
  return String(method ?? '').trim().toLowerCase();
}

/** Maps a persisted or legacy payment_method string to a finance account key. */
export function accountForPaymentMethod(method: string | null | undefined): FinanceAccountKey | null {
  const v = normalizePaymentMethod(method);
  if (!v) return null;
  if (isCashPaymentMethod(v)) return 'cash';
  if (v === CARD_PAYMENT_METHOD || CARD_TOKENS.some((token) => v === token || v.includes(token))) {
    return 'card';
  }
  if (
    v === BANK_TRANSFER_PAYMENT_METHOD ||
    BANK_TRANSFER_TOKENS.some((token) => v === token || v.includes(token))
  ) {
    return 'bank';
  }
  return null;
}

/**
 * Builds the sale patch for a manual "mark paid" action. Stamps payment_status
 * + paid_at, and defaults the method to cash UNLESS the order is already a card
 * sale (online gateway or in-person card terminal), which we never relabel.
 */
export function buildMarkPaidPatch(order: {
  online_payment_method?: string | null;
  payment_method?: string | null;
}): { payment_status: string; paid_at: string; payment_method?: string } {
  const patch: { payment_status: string; paid_at: string; payment_method?: string } = {
    payment_status: 'paid',
    paid_at: new Date().toISOString(),
  };
  const existing = String(order.payment_method ?? '').trim().toLowerCase();
  const online = String(order.online_payment_method ?? '').trim().toLowerCase();
  const isCard =
    existing === 'card' ||
    existing === 'card_online' ||
    online === 'card_online' ||
    online === 'epoint';
  if (!isCard) patch.payment_method = CASH_PAYMENT_METHOD;
  return patch;
}
