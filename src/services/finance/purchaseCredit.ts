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
