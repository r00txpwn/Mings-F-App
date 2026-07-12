import { roundFinanceMoney } from '../../lib/money';

export type DerivedPurchasePaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface CreditPurchaseInput {
  id: string;
  total: number;
  purchaseDate: string;
}

export interface ManualDebtInput {
  id: string;
  total: number;
  debtDate: string;
}

export interface LedgerLineInput {
  id: string;
  total: number;
  lineDate: string;
  source: 'manual' | 'purchase';
}

export interface AllocatedLine {
  id: string;
  total: number;
  paid: number;
  status: DerivedPurchasePaymentStatus;
  source: 'manual' | 'purchase';
}

export interface SupplierOutstandingInput {
  manualDebts: number[];
  creditPurchases: number[];
  payments: number[];
}

export function computeSupplierOutstanding(input: SupplierOutstandingInput): number {
  const debts = sum(input.manualDebts);
  const purchases = sum(input.creditPurchases);
  const paid = sum(input.payments);
  return roundMoney(Math.max(0, debts + purchases - paid));
}

export function computeSupplierCreditBalance(input: SupplierOutstandingInput): number {
  const debts = sum(input.manualDebts);
  const purchases = sum(input.creditPurchases);
  const paid = sum(input.payments);
  return roundMoney(Math.max(0, paid - debts - purchases));
}

/** FIFO allocation for manual supplier debts only (opening balances, informal IOUs). */
export function allocateManualDebtPaymentsFIFO(
  manualDebts: ManualDebtInput[],
  totalPaid: number,
): { manualDebts: AllocatedLine[]; totalRemaining: number } {
  const lines: LedgerLineInput[] = manualDebts
    .map((d) => ({
      id: d.id,
      total: d.total,
      lineDate: d.debtDate,
      source: 'manual' as const,
    }))
    .sort((a, b) => a.lineDate.localeCompare(b.lineDate) || a.id.localeCompare(b.id));

  let remainingPayment = safeAmount(totalPaid);
  const allocated: AllocatedLine[] = [];

  for (const line of lines) {
    const total = safeAmount(line.total);
    const paid = Math.min(total, remainingPayment);
    remainingPayment -= paid;

    let status: DerivedPurchasePaymentStatus = 'unpaid';
    if (paid >= total && total > 0) status = 'paid';
    else if (paid > 0) status = 'partial';

    allocated.push({
      id: line.id,
      total: roundMoney(total),
      paid: roundMoney(paid),
      status,
      source: line.source,
    });
  }

  const totalDebt = sum(lines.map((l) => l.total));
  const totalRemaining = roundMoney(Math.max(0, totalDebt - safeAmount(totalPaid)));

  return {
    manualDebts: allocated,
    totalRemaining,
  };
}

/** @deprecated Purchase lines use record status; FIFO applies to manual debts only. */
export function allocatePaymentsFIFO(
  manualDebts: ManualDebtInput[],
  purchases: CreditPurchaseInput[],
  totalPaid: number,
): {
  manualDebts: AllocatedLine[];
  purchases: AllocatedLine[];
  totalRemaining: number;
} {
  const manualResult = allocateManualDebtPaymentsFIFO(manualDebts, totalPaid);
  const purchaseAllocated: AllocatedLine[] = purchases.map((p) => ({
    id: p.id,
    total: roundMoney(safeAmount(p.total)),
    paid: 0,
    status: 'unpaid' as const,
    source: 'purchase' as const,
  }));

  const totalDebt =
    sum(manualDebts.map((d) => d.total)) + sum(purchases.map((p) => p.total));
  const totalRemaining = roundMoney(Math.max(0, totalDebt - safeAmount(totalPaid)));

  return {
    manualDebts: manualResult.manualDebts,
    purchases: purchaseAllocated,
    totalRemaining,
  };
}

/** @deprecated Use allocatePaymentsFIFO with manualDebts array. Kept for tests migrating from openingBalance. */
export function allocatePaymentsFIFOFromOpening(
  openingBalance: number,
  purchases: CreditPurchaseInput[],
  totalPaid: number,
): { openingPaid: number; openingRemaining: number; purchases: AllocatedLine[] } {
  const manualDebts: ManualDebtInput[] =
    openingBalance > 0
      ? [{ id: '__opening__', total: openingBalance, debtDate: '0000-01-01' }]
      : [];
  const result = allocatePaymentsFIFO(manualDebts, purchases, totalPaid);
  const openingLine = result.manualDebts.find((l) => l.id === '__opening__');
  const openingPaid = openingLine?.paid ?? 0;
  const openingRemaining = roundMoney(Math.max(0, openingBalance - openingPaid));
  return {
    openingPaid,
    openingRemaining,
    purchases: result.purchases,
  };
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + safeAmount(value), 0);
}

function safeAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function roundMoney(value: number): number {
  return roundFinanceMoney(value);
}
