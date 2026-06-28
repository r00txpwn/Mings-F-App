import { describe, it, expect } from 'vitest';
import { buildAccountLedger, type AccountLedgerInput } from '../../src/services/finance/accountLedger';

const empty: AccountLedgerInput = {
  openings: [],
  transfers: [],
  withdrawals: [],
  expenses: [],
  purchases: [],
  payouts: [],
};

describe('buildAccountLedger', () => {
  it('returns an empty ledger for no activity', () => {
    expect(buildAccountLedger(empty)).toEqual([]);
  });

  it('signs transfers in/out per account and marks them deletable', () => {
    const ledger = buildAccountLedger({
      ...empty,
      transfers: [
        { id: 't1', from: 'bank', to: 'card', amount: 600, date: '2026-06-28', notes: 'top up' },
      ],
    });
    const cardIn = ledger.find((e) => e.account === 'card' && e.type === 'transfer_in');
    const bankOut = ledger.find((e) => e.account === 'bank' && e.type === 'transfer_out');
    expect(cardIn?.amount).toBe(600);
    expect(cardIn?.deletable).toBe('transfer');
    expect(cardIn?.recordId).toBe('t1');
    expect(bankOut?.amount).toBe(-600);
    expect(bankOut?.deletable).toBe('transfer');
  });

  it('routes ATM withdrawals to card and cashier withdrawals to bank as negatives', () => {
    const ledger = buildAccountLedger({
      ...empty,
      withdrawals: [
        { id: 'w1', method: 'abb_atm', amount: 200, date: '2026-06-29', notes: '' },
        { id: 'w2', method: 'cashier', amount: 100, date: '2026-06-29', notes: '' },
      ],
    });
    const atm = ledger.find((e) => e.recordId === 'w1');
    const cashier = ledger.find((e) => e.recordId === 'w2');
    expect(atm?.account).toBe('card');
    expect(atm?.amount).toBe(-200);
    expect(atm?.deletable).toBe('withdrawal');
    expect(cashier?.account).toBe('bank');
    expect(cashier?.amount).toBe(-100);
  });

  it('includes opening balances and read-only expenses/purchases, sorted most-recent first', () => {
    const ledger = buildAccountLedger({
      openings: [{ account: 'card', amount: 0, date: '2026-06-28' }],
      transfers: [{ id: 't1', from: 'bank', to: 'card', amount: 600, date: '2026-06-28', notes: '' }],
      withdrawals: [],
      expenses: [{ id: 'e1', account: 'card', amount: 500, date: '2026-06-29', detail: 'Packaging' }],
      purchases: [],
      payouts: [],
    });
    // Sorted by date desc => expense (06-29) first.
    expect(ledger[0].type).toBe('expense');
    expect(ledger[0].amount).toBe(-500);
    expect(ledger[0].deletable).toBeNull();
    const cardSum = ledger
      .filter((e) => e.account === 'card')
      .reduce((sum, e) => sum + e.amount, 0);
    expect(cardSum).toBe(100);
  });

  it('adds channel payouts as positive, read-only entries on the chosen account', () => {
    const ledger = buildAccountLedger({
      ...empty,
      payouts: [
        { id: 'p1', account: 'bank', amount: 450, date: '2026-06-30', detail: 'Wolt' },
        { id: 'p2', account: 'card', amount: 120, date: '2026-06-30', detail: 'Bolt' },
      ],
    });
    const wolt = ledger.find((e) => e.recordId === 'p1');
    const bolt = ledger.find((e) => e.recordId === 'p2');
    expect(wolt?.type).toBe('payout');
    expect(wolt?.account).toBe('bank');
    expect(wolt?.amount).toBe(450);
    expect(wolt?.deletable).toBeNull();
    expect(bolt?.account).toBe('card');
    expect(bolt?.amount).toBe(120);
  });
});
