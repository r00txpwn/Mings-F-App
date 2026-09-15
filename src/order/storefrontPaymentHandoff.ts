/**
 * Storefront card-payment handoff helpers.
 * Browser return query params are the current contract (not proof by themselves):
 * `paid=1`, `payment_error=1`, `payment_pending=1`, plus `sale` / `message`.
 */

export type StorefrontPaymentReturnStatus = 'paid' | 'error' | 'pending' | 'none';

export type StorefrontPaymentReturn = {
  status: StorefrontPaymentReturnStatus;
  saleId: string | null;
  message: string | null;
};

export type PlacedOrderResult = {
  saleId: string;
  displayNumber: string;
  trackToken: string;
};

function asSearchParams(search: string | URLSearchParams): URLSearchParams {
  if (typeof search === 'string') {
    const raw = search.startsWith('?') ? search.slice(1) : search;
    return new URLSearchParams(raw);
  }
  return search;
}

/** Hosted checkout URL from create-payment JSON. Empty/missing → fail closed. */
export function hostedCheckoutUrlFromInit(
  data: { checkoutUrl?: unknown } | null | undefined
): string | null {
  if (!data || typeof data.checkoutUrl !== 'string') return null;
  const url = data.checkoutUrl.trim();
  return url || null;
}

export type CardPaymentInitHandoff =
  | { action: 'redirect'; checkoutUrl: string }
  | { action: 'fail_closed' };

/**
 * Terminal for this sale. Fail-closed: do not navigate, do not clear cart,
 * do not show placed confirmation, and do not retry create-payment on the
 * cancelled sale — next Place Order must mint a new clientRequestId.
 */
export function cardPaymentInitHandoff(pay: {
  ok: boolean;
  data?: { checkoutUrl?: unknown } | null;
}): CardPaymentInitHandoff {
  if (!pay.ok) return { action: 'fail_closed' };
  const checkoutUrl = hostedCheckoutUrlFromInit(pay.data);
  if (!checkoutUrl) return { action: 'fail_closed' };
  return { action: 'redirect', checkoutUrl };
}

export function parseStorefrontPaymentReturn(
  search: string | URLSearchParams
): StorefrontPaymentReturn {
  const params = asSearchParams(search);
  const saleId = params.get('sale')?.trim() || null;
  const paid = params.get('paid') === '1';
  const error = params.get('payment_error') === '1';
  const pending = params.get('payment_pending') === '1';
  const flagCount = Number(paid) + Number(error) + Number(pending);
  if (flagCount > 1) {
    return { status: 'error', saleId, message: null };
  }
  if (paid) return { status: 'paid', saleId, message: null };
  if (error) {
    return { status: 'error', saleId, message: params.get('message')?.trim() || null };
  }
  if (pending) return { status: 'pending', saleId, message: null };
  return { status: 'none', saleId: null, message: null };
}

export function stripStorefrontPaymentReturnParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete('paid');
  next.delete('payment_error');
  next.delete('payment_pending');
  next.delete('sale');
  next.delete('message');
  return next;
}

export function shouldClearCartOnPaymentReturn(status: StorefrontPaymentReturnStatus): boolean {
  return status === 'paid';
}

export function paymentReturnBannerKind(
  status: StorefrontPaymentReturnStatus
): 'success' | 'error' | 'pending' | null {
  if (status === 'paid') return 'success';
  if (status === 'error') return 'error';
  if (status === 'pending') return 'pending';
  return null;
}

export function placedOrderFromSaleRow(
  sale: { id?: string | null; display_number?: string | null; track_token?: string | null } | null
): PlacedOrderResult | null {
  const saleId = sale?.id?.trim();
  if (!saleId) return null;
  return {
    saleId,
    displayNumber: String(sale?.display_number ?? '').trim() || saleId,
    trackToken: String(sale?.track_token ?? '').trim(),
  };
}
