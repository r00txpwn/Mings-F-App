/**
 * Pure COGS / purchase math for agent-ops (mirror of src/lib/cogsDiscount + purchaseCredit).
 * No localStorage / browser APIs.
 */

const FINANCE_DECIMALS = 3;

export function roundFinanceMoney(value: number): number {
  const factor = 10 ** FINANCE_DECIMALS;
  return Math.round(value * factor) / factor;
}

/** Post-discount total: qty * unit * (1 - discount/100), rounded to 3 dp. */
export function computePurchaseTotalCost(
  quantity: number,
  unitCost: number,
  discountPercent: number
): number {
  const listTotal = quantity * unitCost;
  const net = listTotal * (1 - discountPercent / 100);
  return roundFinanceMoney(net);
}

export function purchaseCreditFields(isOnCredit: boolean): {
  is_on_credit: boolean;
  payment_status: 'pending' | 'paid';
} {
  return {
    is_on_credit: isOnCredit,
    payment_status: isOnCredit ? 'pending' : 'paid',
  };
}
