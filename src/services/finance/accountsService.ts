import { supabase } from '../../lib/supabase';
import type { AnalyticsServiceResponse } from '../../types/analytics';
import { accountForPaymentMethod } from '../../lib/cashPayment';
import { isOnCreditFromPurchase } from './purchaseCredit';
import { fetchCashDrawer } from './cashDrawerService';
import {
  computeAccountBalances,
  type AccountBalances,
  type AccountEntry,
  type AccountsInput,
} from './accounts';

function safeNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toDate(value: unknown): string {
  return String(value ?? '').slice(0, 10);
}

/**
 * Computes Cash / Bank / Card balances from finance_accounts, transfers,
 * withdrawals, deposits, routed expenses, and the existing cash drawer.
 */
export async function fetchAccountBalances(): Promise<AnalyticsServiceResponse<AccountBalances>> {
  const [
    accountsRes,
    transfersRes,
    withdrawalsRes,
    movementsRes,
    expensesRes,
    purchasesRes,
    payoutsRes,
    drawerRes,
  ] = await Promise.all([
    supabase.from('finance_accounts').select('key, opening_balance').in('key', ['bank', 'card']),
    supabase.from('account_transfers').select('from_account, to_account, amount, transfer_date'),
    supabase.from('bank_withdrawals').select('method, amount, withdrawal_date'),
    supabase
      .from('cash_movements')
      .select('category, direction, amount, movement_date')
      .eq('category', 'bank_deposit')
      .eq('direction', 'out'),
    supabase.from('operational_expenses').select('amount, payment_method, expense_date'),
    supabase.from('purchases').select('total_cost, payment_method, is_on_credit, payment_status, purchase_date'),
    supabase
      .from('platform_payouts')
      .select('payout_amount, received_account, payout_date')
      .in('received_account', ['bank', 'card']),
    fetchCashDrawer(),
  ]);

  const firstError =
    accountsRes.error?.message ??
    transfersRes.error?.message ??
    withdrawalsRes.error?.message ??
    movementsRes.error?.message ??
    expensesRes.error?.message ??
    purchasesRes.error?.message ??
    payoutsRes.error?.message ??
    drawerRes.error ??
    null;

  if (firstError) {
    return { data: null, error: firstError };
  }

  if (!drawerRes.data) {
    return { data: null, error: 'Cash drawer unavailable' };
  }

  const openingByKey = new Map(
    ((accountsRes.data ?? []) as Array<{ key: string; opening_balance: unknown }>).map((row) => [
      row.key,
      safeNumber(row.opening_balance),
    ]),
  );

  const bankDepositsIn: AccountEntry[] = ((movementsRes.data ?? []) as Array<Record<string, unknown>>).map(
    (row) => ({
      date: toDate(row.movement_date),
      amount: safeNumber(row.amount),
    }),
  );

  const cashierWithdrawalsOut: AccountEntry[] = [];
  const cardAtmWithdrawalsOut: AccountEntry[] = [];
  for (const row of (withdrawalsRes.data ?? []) as Array<Record<string, unknown>>) {
    const entry: AccountEntry = {
      date: toDate(row.withdrawal_date),
      amount: safeNumber(row.amount),
    };
    if (String(row.method) === 'cashier') cashierWithdrawalsOut.push(entry);
    else if (String(row.method) === 'abb_atm') cardAtmWithdrawalsOut.push(entry);
  }

  const transfersBankToCard: AccountEntry[] = [];
  for (const row of (transfersRes.data ?? []) as Array<Record<string, unknown>>) {
    if (String(row.from_account) === 'bank' && String(row.to_account) === 'card') {
      transfersBankToCard.push({
        date: toDate(row.transfer_date),
        amount: safeNumber(row.amount),
      });
    }
  }

  const bankExpenses: AccountEntry[] = [];
  const cardExpenses: AccountEntry[] = [];
  for (const row of (expensesRes.data ?? []) as Array<Record<string, unknown>>) {
    const account = accountForPaymentMethod(row.payment_method as string | null);
    if (account !== 'bank' && account !== 'card') continue;
    const entry: AccountEntry = {
      date: toDate(row.expense_date),
      amount: safeNumber(row.amount),
    };
    if (account === 'bank') bankExpenses.push(entry);
    else cardExpenses.push(entry);
  }

  // "Paid now" purchases (is_on_credit = false) deduct from the account they
  // were paid from. On-account purchases are skipped — they settle later via
  // supplier_account_payments, so counting them here would double-count.
  const bankPurchases: AccountEntry[] = [];
  const cardPurchases: AccountEntry[] = [];
  for (const row of (purchasesRes.data ?? []) as Array<Record<string, unknown>>) {
    if (
      isOnCreditFromPurchase({
        is_on_credit: row.is_on_credit as boolean | null,
        payment_status: row.payment_status as string | null,
      })
    )
      continue;
    const account = accountForPaymentMethod(row.payment_method as string | null);
    if (account !== 'bank' && account !== 'card') continue;
    const entry: AccountEntry = {
      date: toDate(row.purchase_date),
      amount: safeNumber(row.total_cost),
    };
    if (account === 'bank') bankPurchases.push(entry);
    else cardPurchases.push(entry);
  }

  // Platform/channel payouts credit the account they landed in. Cash payouts are
  // handled in the cash drawer, so only bank/card are fetched here.
  const bankPayoutsIn: AccountEntry[] = [];
  const cardPayoutsIn: AccountEntry[] = [];
  for (const row of (payoutsRes.data ?? []) as Array<Record<string, unknown>>) {
    const account = String(row.received_account);
    if (account !== 'bank' && account !== 'card') continue;
    const entry: AccountEntry = {
      date: toDate(row.payout_date),
      amount: safeNumber(row.payout_amount),
    };
    if (account === 'bank') bankPayoutsIn.push(entry);
    else cardPayoutsIn.push(entry);
  }

  const input: AccountsInput = {
    openingBank: openingByKey.get('bank') ?? 0,
    openingCard: openingByKey.get('card') ?? 0,
    cashClosingBalance: drawerRes.data.closingBalance,
    bankDepositsIn,
    cashierWithdrawalsOut,
    cardAtmWithdrawalsOut,
    transfersBankToCard,
    bankExpenses,
    cardExpenses,
    bankPurchases,
    cardPurchases,
    bankPayoutsIn,
    cardPayoutsIn,
  };

  return { data: computeAccountBalances(input), error: null };
}

/** @deprecated Prefer fetchAccountBalances — kept for callers that only need cash. */
export async function fetchCashOnHandFromAccounts(): Promise<AnalyticsServiceResponse<number>> {
  const res = await fetchAccountBalances();
  if (res.error || !res.data) return { data: null, error: res.error };
  return { data: res.data.cash, error: null };
}
