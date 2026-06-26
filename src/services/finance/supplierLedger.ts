export type DerivedPurchasePaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface CreditPurchaseInput {
  id: string;
  total: number;
  purchaseDate: string;
}

export interface AllocatedPurchase {
  id: string;
  total: number;
  paid: number;
  status: DerivedPurchasePaymentStatus;
}

export interface SupplierOutstandingInput {
  openingBalance: number;
  creditPurchases: number[];
  payments: number[];
}

export function computeSupplierOutstanding(input: SupplierOutstandingInput): number {
  const opening = safeAmount(input.openingBalance);
  const purchases = sum(input.creditPurchases);
  const paid = sum(input.payments);
  return roundMoney(Math.max(0, opening + purchases - paid));
}

export function allocatePaymentsFIFO(
  openingBalance: number,
  purchases: CreditPurchaseInput[],
  totalPaid: number,
): { openingPaid: number; openingRemaining: number; purchases: AllocatedPurchase[] } {
  let remainingPayment = safeAmount(totalPaid);
  const opening = safeAmount(openingBalance);

  const openingPaid = Math.min(opening, remainingPayment);
  remainingPayment -= openingPaid;
  const openingRemaining = roundMoney(opening - openingPaid);

  const sorted = [...purchases].sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));
  const allocated: AllocatedPurchase[] = [];

  for (const purchase of sorted) {
    const total = safeAmount(purchase.total);
    const paid = Math.min(total, remainingPayment);
    remainingPayment -= paid;

    let status: DerivedPurchasePaymentStatus = 'unpaid';
    if (paid >= total && total > 0) status = 'paid';
    else if (paid > 0) status = 'partial';

    allocated.push({
      id: purchase.id,
      total: roundMoney(total),
      paid: roundMoney(paid),
      status,
    });
  }

  return {
    openingPaid: roundMoney(openingPaid),
    openingRemaining,
    purchases: allocated,
  };
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + safeAmount(value), 0);
}

function safeAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
