/**
 * Pure three-account balance math (no Supabase access) — unit-testable.
 *
 * Cash on Hand is supplied from the existing cash-drawer closing balance.
 * Bank and Card balances are derived from opening balances, transfers,
 * withdrawals, deposits, and routed operational expenses.
 */

import type { FinanceAccountKey } from '../../lib/supabase';

export interface AccountEntry {
  /** ISO date 'YYYY-MM-DD'. */
  date: string;
  amount: number;
}

export interface AccountsInput {
  openingBank: number;
  openingCard: number;
  /** All-time closing balance from computeCashDrawer(). */
  cashClosingBalance: number;
  /** Cash drawer -> bank (cash_movements bank_deposit). */
  bankDepositsIn: AccountEntry[];
  /** Main bank -> cash (cashier withdrawal, full amount). */
  cashierWithdrawalsOut: AccountEntry[];
  /** Card account -> cash (ABB ATM withdrawal, full amount). */
  cardAtmWithdrawalsOut: AccountEntry[];
  /** Main bank -> card account (internal transfer). */
  transfersBankToCard: AccountEntry[];
  /** Operational expenses paid by bank transfer. */
  bankExpenses: AccountEntry[];
  /** Operational expenses paid by card. */
  cardExpenses: AccountEntry[];
  /** "Paid now" purchases (is_on_credit = false) settled by bank transfer. */
  bankPurchases?: AccountEntry[];
  /** "Paid now" purchases (is_on_credit = false) settled by card. */
  cardPurchases?: AccountEntry[];
  /** Platform/channel payouts received into the Main bank account. */
  bankPayoutsIn?: AccountEntry[];
  /** Platform/channel payouts received into the Card account. */
  cardPayoutsIn?: AccountEntry[];
}

export interface AccountBalances {
  cash: number;
  bank: number;
  card: number;
}

export type AccountBalancesByKey = Record<FinanceAccountKey, number>;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function sumEntries(entries: AccountEntry[]): number {
  return entries.reduce((sum, entry) => sum + safe(entry.amount), 0);
}

export function computeAccountBalances(input: AccountsInput): AccountBalances {
  const bank =
    safe(input.openingBank) +
    sumEntries(input.bankDepositsIn) +
    sumEntries(input.bankPayoutsIn ?? []) -
    sumEntries(input.cashierWithdrawalsOut) -
    sumEntries(input.transfersBankToCard) -
    sumEntries(input.bankExpenses) -
    sumEntries(input.bankPurchases ?? []);

  const card =
    safe(input.openingCard) +
    sumEntries(input.transfersBankToCard) +
    sumEntries(input.cardPayoutsIn ?? []) -
    sumEntries(input.cardAtmWithdrawalsOut) -
    sumEntries(input.cardExpenses) -
    sumEntries(input.cardPurchases ?? []);

  return {
    cash: roundMoney(safe(input.cashClosingBalance)),
    bank: roundMoney(bank),
    card: roundMoney(card),
  };
}

export function balancesByKey(balances: AccountBalances): AccountBalancesByKey {
  return {
    cash: balances.cash,
    bank: balances.bank,
    card: balances.card,
  };
}
