import { supabase } from '../../lib/supabase';
import type { AnalyticsServiceResponse } from '../../types/analytics';
import { isCashPaymentMethod } from '../../lib/cashPayment';
import {
  computeCashDrawer,
  type CashDrawerInput,
  type CashDrawerResult,
  type CashEntry,
} from './cashDrawer';

function safeNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toDate(value: unknown): string {
  return String(value ?? '').slice(0, 10);
}

function isPaidStatus(status: unknown): boolean {
  const s = String(status ?? '').trim().toLowerCase();
  return s === 'paid' || s === 'completed';
}

interface CashDrawerParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Fetches all cash-relevant rows and computes the drawer balance. When a period
 * is supplied, history before it folds into openingBalance.
 */
export async function fetchCashDrawer(
  params: CashDrawerParams = {},
): Promise<AnalyticsServiceResponse<CashDrawerResult>> {
  const [salesRes, movementsRes, expensesRes, supplierPayRes, liabilityPayRes, withdrawalsRes] =
    await Promise.all([
      supabase
        .from('sales')
        .select('total_price, payment_status, payment_method, online_payment_method, paid_at, sale_date'),
      supabase.from('cash_movements').select('direction, amount, movement_date'),
      supabase.from('operational_expenses').select('amount, payment_method, expense_date'),
      supabase.from('supplier_account_payments').select('amount, payment_method, paid_date'),
      supabase.from('liability_payments').select('amount, payment_method, paid_date'),
      supabase.from('bank_withdrawals').select('amount, fee_amount, withdrawal_date'),
    ]);

  const firstError =
    salesRes.error ??
    movementsRes.error ??
    expensesRes.error ??
    supplierPayRes.error ??
    liabilityPayRes.error ??
    withdrawalsRes.error;
  if (firstError) {
    return { data: null, error: firstError.message };
  }

  const orderCashIn: CashEntry[] = [];
  for (const row of (salesRes.data ?? []) as Array<Record<string, unknown>>) {
    if (!isPaidStatus(row.payment_status)) continue;
    const isCash =
      isCashPaymentMethod(row.payment_method as string | null) ||
      isCashPaymentMethod(row.online_payment_method as string | null);
    if (!isCash) continue;
    orderCashIn.push({
      date: toDate(row.paid_at ?? row.sale_date),
      amount: safeNumber(row.total_price),
    });
  }

  const movementsIn: CashEntry[] = [];
  const movementsOut: CashEntry[] = [];
  for (const row of (movementsRes.data ?? []) as Array<Record<string, unknown>>) {
    const entry: CashEntry = {
      date: toDate(row.movement_date),
      amount: safeNumber(row.amount),
    };
    if (String(row.direction) === 'in') movementsIn.push(entry);
    else movementsOut.push(entry);
  }

  const cashExpenses: CashEntry[] = ((expensesRes.data ?? []) as Array<Record<string, unknown>>)
    .filter((row) => isCashPaymentMethod(row.payment_method as string | null))
    .map((row) => ({ date: toDate(row.expense_date), amount: safeNumber(row.amount) }));

  const cashSupplierPayments: CashEntry[] = ((supplierPayRes.data ?? []) as Array<Record<string, unknown>>)
    .filter((row) => isCashPaymentMethod(row.payment_method as string | null))
    .map((row) => ({ date: toDate(row.paid_date), amount: safeNumber(row.amount) }));

  const cashLiabilityPayments: CashEntry[] = ((liabilityPayRes.data ?? []) as Array<Record<string, unknown>>)
    .filter((row) => isCashPaymentMethod(row.payment_method as string | null))
    .map((row) => ({ date: toDate(row.paid_date), amount: safeNumber(row.amount) }));

  // A bank withdrawal pulls physical cash into the drawer; the fee never
  // reaches the drawer, so net cash in = amount − fee.
  const bankWithdrawalsIn: CashEntry[] = ((withdrawalsRes.data ?? []) as Array<Record<string, unknown>>)
    .map((row) => ({
      date: toDate(row.withdrawal_date),
      amount: safeNumber(row.amount) - safeNumber(row.fee_amount),
    }));

  const input: CashDrawerInput = {
    orderCashIn,
    bankWithdrawalsIn,
    movementsIn,
    cashExpenses,
    cashSupplierPayments,
    cashLiabilityPayments,
    movementsOut,
  };

  return {
    data: computeCashDrawer(input, params.startDate, params.endDate),
    error: null,
  };
}

/** All-time closing cash balance for the dashboard hero card. */
export async function fetchCashOnHand(): Promise<AnalyticsServiceResponse<number>> {
  const res = await fetchCashDrawer();
  if (res.error || !res.data) return { data: null, error: res.error };
  return { data: res.data.closingBalance, error: null };
}
