/**
 * Preparing-branch policy for kds-order-status-update (PAYMENT_NOT_CONFIRMED).
 */
import { paymentConfirmedForKdsPrep } from './onlinePaymentMethod.ts';

export type KdsPreparingSale = {
  order_status: string | null;
  source: string | null;
  online_payment_method: string | null;
  payment_status: string | null;
};

export type KdsPreparingGate =
  | { ok: true }
  | { ok: false; status: number; code: string; message: string };

export function evaluateKdsPreparingTransition(sale: KdsPreparingSale | null): KdsPreparingGate {
  if (!sale) {
    return { ok: false, status: 404, code: 'NOT_FOUND', message: 'Sale not found' };
  }
  if (sale.order_status !== 'pending') {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_STATE',
      message: 'Only pending orders can start preparing',
    };
  }
  if (
    !paymentConfirmedForKdsPrep({
      source: sale.source,
      onlinePaymentMethod: sale.online_payment_method,
      paymentStatus: sale.payment_status,
    })
  ) {
    return {
      ok: false,
      status: 409,
      code: 'PAYMENT_NOT_CONFIRMED',
      message: 'Card payment must be confirmed before preparing',
    };
  }
  return { ok: true };
}
