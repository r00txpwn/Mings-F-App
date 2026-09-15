/**
 * Pre-checkout guards for united-payment-create-payment (and the same shape as epoint-create-payment).
 * Pure — no Deno, no United Payment HTTP.
 */

export const PAYMENT_INIT_TOKEN_TTL_MS = 20 * 60_000;

export type UnitedPaymentCreateSale = {
  source: string | null;
  payment_status: string | null;
  payment_init_token: string | null;
  created_at: string | null;
  online_payment_id: string | null;
  customer_user_id: string | null;
  total_price: number | string;
};

export type UnitedPaymentCreateGuardResult =
  | { ok: true; amount: number }
  | { ok: false; status: number; error: string };

export function evaluateUnitedPaymentCreateGuards(
  sale: UnitedPaymentCreateSale | null,
  ctx: { paymentInitToken: string; nowMs?: number; callerUserId?: string | null }
): UnitedPaymentCreateGuardResult {
  if (!sale) return { ok: false, status: 404, error: 'Sale not found' };
  if (!['online_delivery', 'online_takeaway'].includes(String(sale.source))) {
    return { ok: false, status: 400, error: 'Not an online sale' };
  }
  if (sale.payment_status !== 'pending') {
    return { ok: false, status: 400, error: 'Payment already processed or not pending card payment' };
  }
  if ((sale.payment_init_token ?? null) !== ctx.paymentInitToken) {
    return { ok: false, status: 403, error: 'Invalid payment init token' };
  }
  const createdAt = new Date(String(sale.created_at ?? ''));
  const now = ctx.nowMs ?? Date.now();
  if (Number.isNaN(createdAt.getTime()) || now - createdAt.getTime() > PAYMENT_INIT_TOKEN_TTL_MS) {
    return { ok: false, status: 410, error: 'paymentInitToken expired' };
  }
  if (sale.online_payment_id) {
    return { ok: false, status: 409, error: 'Payment already initialized for this sale' };
  }
  if (sale.customer_user_id && !ctx.callerUserId) {
    return { ok: false, status: 401, error: 'Authentication required for this sale' };
  }
  if (sale.customer_user_id && ctx.callerUserId && sale.customer_user_id !== ctx.callerUserId) {
    return { ok: false, status: 403, error: 'Not allowed for this sale' };
  }
  const amount = Number(sale.total_price);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, status: 400, error: 'Invalid sale amount' };
  }
  return { ok: true, amount };
}
