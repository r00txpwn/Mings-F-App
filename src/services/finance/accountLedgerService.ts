import { supabase } from '../../lib/supabase';
import type { AnalyticsServiceResponse } from '../../types/analytics';
import { accountForPaymentMethod } from '../../lib/cashPayment';
import { isOnCreditFromPurchase } from './purchaseCredit';
import { buildAccountLedger, type AccountLedgerEntry, type AccountLedgerInput } from './accountLedger';

function toDate(value: unknown): string {
  return String(value ?? '').slice(0, 10);
}

function safeNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function nameFrom(rel: unknown): string {
  const obj = Array.isArray(rel) ? rel[0] : rel;
  if (obj && typeof obj === 'object' && 'name' in obj) {
    return String((obj as { name?: unknown }).name ?? '');
  }
  return '';
}

/** Fetches and assembles the Bank/Card activity ledger from Supabase. */
export async function fetchAccountLedger(): Promise<AnalyticsServiceResponse<AccountLedgerEntry[]>> {
  const [accountsRes, transfersRes, withdrawalsRes, expensesRes, purchasesRes, payoutsRes] = await Promise.all([
    supabase.from('finance_accounts').select('key, opening_balance, opening_date').in('key', ['bank', 'card']),
    supabase.from('account_transfers').select('id, from_account, to_account, amount, transfer_date, notes'),
    supabase.from('bank_withdrawals').select('id, method, amount, withdrawal_date, notes'),
    supabase
      .from('operational_expenses')
      .select('id, amount, payment_method, expense_date, description, expense_items(name), master_categories(name)'),
    supabase
      .from('purchases')
      .select(
        'id, total_cost, payment_method, is_on_credit, payment_status, purchase_date, products(name), suppliers(name), master_categories(name)',
      ),
    supabase
      .from('platform_payouts')
      .select('id, payout_amount, received_account, payout_date, notes, sales_channels(name)')
      .in('received_account', ['bank', 'card']),
  ]);

  const firstError =
    accountsRes.error?.message ??
    transfersRes.error?.message ??
    withdrawalsRes.error?.message ??
    expensesRes.error?.message ??
    purchasesRes.error?.message ??
    payoutsRes.error?.message ??
    null;

  if (firstError) {
    return { data: null, error: firstError };
  }

  const openings = ((accountsRes.data ?? []) as Array<Record<string, unknown>>)
    .map((row) => ({
      account: String(row.key) as 'bank' | 'card',
      amount: safeNumber(row.opening_balance),
      date: toDate(row.opening_date) || toDate(new Date().toISOString()),
    }))
    .filter((row) => row.account === 'bank' || row.account === 'card');

  const transfers = ((transfersRes.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    from: String(row.from_account),
    to: String(row.to_account),
    amount: safeNumber(row.amount),
    date: toDate(row.transfer_date),
    notes: String(row.notes ?? ''),
  }));

  const withdrawals = ((withdrawalsRes.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    method: String(row.method),
    amount: safeNumber(row.amount),
    date: toDate(row.withdrawal_date),
    notes: String(row.notes ?? ''),
  }));

  const expenses: AccountLedgerInput['expenses'] = [];
  for (const row of (expensesRes.data ?? []) as Array<Record<string, unknown>>) {
    const account = accountForPaymentMethod(row.payment_method as string | null);
    if (account !== 'bank' && account !== 'card') continue;
    const detail =
      String(row.description ?? '') || nameFrom(row.expense_items) || nameFrom(row.master_categories);
    expenses.push({
      id: String(row.id),
      account,
      amount: safeNumber(row.amount),
      date: toDate(row.expense_date),
      detail,
    });
  }

  const purchases: AccountLedgerInput['purchases'] = [];
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
    const detail =
      [nameFrom(row.products), nameFrom(row.suppliers)].filter(Boolean).join(' · ') ||
      nameFrom(row.master_categories);
    purchases.push({
      id: String(row.id),
      account,
      amount: safeNumber(row.total_cost),
      date: toDate(row.purchase_date),
      detail,
    });
  }

  const payouts: AccountLedgerInput['payouts'] = [];
  for (const row of (payoutsRes.data ?? []) as Array<Record<string, unknown>>) {
    const account = String(row.received_account);
    if (account !== 'bank' && account !== 'card') continue;
    const detail = [nameFrom(row.sales_channels), String(row.notes ?? '')].filter(Boolean).join(' · ');
    payouts.push({
      id: String(row.id),
      account,
      amount: safeNumber(row.payout_amount),
      date: toDate(row.payout_date),
      detail,
    });
  }

  return {
    data: buildAccountLedger({ openings, transfers, withdrawals, expenses, purchases, payouts }),
    error: null,
  };
}
