import type { DerivedPurchasePaymentStatus } from './supplierLedger';

/** Dual-write helper: on-account purchases stay pending; paid-now purchases are paid. */
export function purchaseCreditFields(isOnCredit: boolean): {
  is_on_credit: boolean;
  payment_status: 'pending' | 'paid';
} {
  return {
    is_on_credit: isOnCredit,
    payment_status: isOnCredit ? 'pending' : 'paid',
  };
}

export function isOnCreditFromPurchase(row: {
  is_on_credit?: boolean | null;
  payment_status?: string | null;
}): boolean {
  if (row.is_on_credit != null) return Boolean(row.is_on_credit);
  return String(row.payment_status ?? 'pending').toLowerCase() !== 'paid';
}

/** Supplier ledger line status from the purchase record — not pooled FIFO payments. */
export function derivePurchaseLedgerStatus(row: {
  is_on_credit?: boolean | null;
  payment_status?: string | null;
  total: number;
}): { paid: number; status: DerivedPurchasePaymentStatus } {
  const total = Number.isFinite(row.total) ? Math.max(0, row.total) : 0;
  if (!isOnCreditFromPurchase(row)) {
    return { paid: total, status: 'paid' };
  }

  const paymentStatus = String(row.payment_status ?? 'pending').toLowerCase();
  if (paymentStatus === 'paid') {
    return { paid: total, status: 'paid' };
  }
  if (paymentStatus === 'partial') {
    return { paid: 0, status: 'partial' };
  }
  return { paid: 0, status: 'unpaid' };
}
