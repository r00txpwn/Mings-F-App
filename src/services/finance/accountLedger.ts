/**
 * Pure account-activity ledger math for the Bank and Card accounts (no
 * Supabase access) — unit-testable.
 *
 * Produces a unified, dated list of every entry that moves a Bank or Card
 * balance: opening balance, internal transfers, ATM/cashier withdrawals,
 * routed operational expenses / paid-now purchases, and channel payouts
 * received into the account. Cash is intentionally excluded — it has its own
 * breakdown on the Cash drawer tab.
 */

export type LedgerAccount = 'bank' | 'card';

export type AccountLedgerType =
  | 'opening'
  | 'transfer_in'
  | 'transfer_out'
  | 'withdrawal'
  | 'expense'
  | 'purchase'
  | 'payout';

/** Which delete handler (if any) owns this entry. */
export type LedgerDeletable = 'transfer' | 'withdrawal' | null;

export interface AccountLedgerEntry {
  /** Stable key for list rendering. */
  key: string;
  /** DB row id for deletable rows; null otherwise. */
  recordId: string | null;
  account: LedgerAccount;
  type: AccountLedgerType;
  /** ISO date 'YYYY-MM-DD'. */
  date: string;
  /** Signed amount: positive = into account, negative = out of account. */
  amount: number;
  /** Free-text detail (notes / description / supplier-product). */
  detail: string;
  deletable: LedgerDeletable;
}

export interface AccountLedgerInput {
  openings: Array<{ account: LedgerAccount; amount: number; date: string }>;
  transfers: Array<{ id: string; from: string; to: string; amount: number; date: string; notes: string }>;
  withdrawals: Array<{ id: string; method: string; amount: number; date: string; notes: string }>;
  expenses: Array<{ id: string; account: LedgerAccount; amount: number; date: string; detail: string }>;
  purchases: Array<{ id: string; account: LedgerAccount; amount: number; date: string; detail: string }>;
  payouts: Array<{ id: string; account: LedgerAccount; amount: number; date: string; detail: string }>;
}

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/** Builds the unified Bank/Card ledger, sorted most-recent first. */
export function buildAccountLedger(input: AccountLedgerInput): AccountLedgerEntry[] {
  const entries: AccountLedgerEntry[] = [];

  for (const row of input.openings) {
    entries.push({
      key: `opening-${row.account}`,
      recordId: null,
      account: row.account,
      type: 'opening',
      date: row.date,
      amount: safe(row.amount),
      detail: '',
      deletable: null,
    });
  }

  for (const row of input.transfers) {
    if (row.to === 'bank' || row.to === 'card') {
      entries.push({
        key: `transfer-in-${row.id}`,
        recordId: row.id,
        account: row.to as LedgerAccount,
        type: 'transfer_in',
        date: row.date,
        amount: safe(row.amount),
        detail: row.notes ?? '',
        deletable: 'transfer',
      });
    }
    if (row.from === 'bank' || row.from === 'card') {
      entries.push({
        key: `transfer-out-${row.id}`,
        recordId: row.id,
        account: row.from as LedgerAccount,
        type: 'transfer_out',
        date: row.date,
        amount: -safe(row.amount),
        detail: row.notes ?? '',
        deletable: 'transfer',
      });
    }
  }

  for (const row of input.withdrawals) {
    const account: LedgerAccount = row.method === 'abb_atm' ? 'card' : 'bank';
    entries.push({
      key: `withdrawal-${row.id}`,
      recordId: row.id,
      account,
      type: 'withdrawal',
      date: row.date,
      amount: -safe(row.amount),
      detail: row.notes ?? '',
      deletable: 'withdrawal',
    });
  }

  for (const row of input.expenses) {
    entries.push({
      key: `expense-${row.id}`,
      recordId: row.id,
      account: row.account,
      type: 'expense',
      date: row.date,
      amount: -safe(row.amount),
      detail: row.detail,
      deletable: null,
    });
  }

  for (const row of input.purchases) {
    entries.push({
      key: `purchase-${row.id}`,
      recordId: row.id,
      account: row.account,
      type: 'purchase',
      date: row.date,
      amount: -safe(row.amount),
      detail: row.detail,
      deletable: null,
    });
  }

  for (const row of input.payouts) {
    entries.push({
      key: `payout-${row.id}`,
      recordId: row.id,
      account: row.account,
      type: 'payout',
      date: row.date,
      amount: safe(row.amount),
      detail: row.detail,
      deletable: null,
    });
  }

  return entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
