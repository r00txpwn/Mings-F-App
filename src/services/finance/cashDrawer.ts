/**
 * Pure cash-drawer math (no Supabase access) so it is unit-testable.
 *
 * Cash on hand = opening float + cash collected from paid cash orders
 *   − cash expenses − cash supplier payments − cash liability payments
 *   − bank deposits ± manual adjustments.
 *
 * Ins are positive, outs negative. When a period [startDate, endDate] is given,
 * everything strictly before startDate folds into `openingBalance`, and the
 * closing balance is openingBalance + (period ins − period outs).
 */

export interface CashEntry {
  /** ISO date 'YYYY-MM-DD'. */
  date: string;
  amount: number;
}

export interface CashDrawerInput {
  orderCashIn: CashEntry[];
  /** Net cash pulled from the bank (withdrawal amount − fee). */
  bankWithdrawalsIn: CashEntry[];
  movementsIn: CashEntry[];
  cashExpenses: CashEntry[];
  cashSupplierPayments: CashEntry[];
  cashLiabilityPayments: CashEntry[];
  movementsOut: CashEntry[];
}

export interface CashDrawerResult {
  openingBalance: number;
  cashIn: { orders: number; bankWithdrawals: number; movementsIn: number; total: number };
  cashOut: {
    expenses: number;
    supplierPayments: number;
    liabilityPayments: number;
    movementsOut: number;
    total: number;
  };
  netChange: number;
  closingBalance: number;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function isBefore(date: string, startDate?: string): boolean {
  return Boolean(startDate) && date < (startDate as string);
}

function isWithin(date: string, startDate?: string, endDate?: string): boolean {
  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;
  return true;
}

function sumWithin(entries: CashEntry[], startDate?: string, endDate?: string): number {
  return entries.reduce(
    (sum, e) => (isWithin(e.date, startDate, endDate) ? sum + safe(e.amount) : sum),
    0,
  );
}

export function computeCashDrawer(
  input: CashDrawerInput,
  startDate?: string,
  endDate?: string,
): CashDrawerResult {
  // Opening = signed net of every entry strictly before the period start.
  let opening = 0;
  const addOpening = (entries: CashEntry[], sign: 1 | -1) => {
    for (const e of entries) {
      if (isBefore(e.date, startDate)) opening += sign * safe(e.amount);
    }
  };
  addOpening(input.orderCashIn, 1);
  addOpening(input.bankWithdrawalsIn, 1);
  addOpening(input.movementsIn, 1);
  addOpening(input.cashExpenses, -1);
  addOpening(input.cashSupplierPayments, -1);
  addOpening(input.cashLiabilityPayments, -1);
  addOpening(input.movementsOut, -1);

  const orders = sumWithin(input.orderCashIn, startDate, endDate);
  const bankWithdrawals = sumWithin(input.bankWithdrawalsIn, startDate, endDate);
  const movementsIn = sumWithin(input.movementsIn, startDate, endDate);
  const expenses = sumWithin(input.cashExpenses, startDate, endDate);
  const supplierPayments = sumWithin(input.cashSupplierPayments, startDate, endDate);
  const liabilityPayments = sumWithin(input.cashLiabilityPayments, startDate, endDate);
  const movementsOut = sumWithin(input.movementsOut, startDate, endDate);

  const cashInTotal = orders + bankWithdrawals + movementsIn;
  const cashOutTotal = expenses + supplierPayments + liabilityPayments + movementsOut;
  const netChange = cashInTotal - cashOutTotal;

  return {
    openingBalance: roundMoney(opening),
    cashIn: {
      orders: roundMoney(orders),
      bankWithdrawals: roundMoney(bankWithdrawals),
      movementsIn: roundMoney(movementsIn),
      total: roundMoney(cashInTotal),
    },
    cashOut: {
      expenses: roundMoney(expenses),
      supplierPayments: roundMoney(supplierPayments),
      liabilityPayments: roundMoney(liabilityPayments),
      movementsOut: roundMoney(movementsOut),
      total: roundMoney(cashOutTotal),
    },
    netChange: roundMoney(netChange),
    closingBalance: roundMoney(opening + netChange),
  };
}
