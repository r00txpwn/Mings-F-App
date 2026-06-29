import { describe, it, expect } from 'vitest';
import { computeAccountBalances, type AccountsInput } from '../../src/services/finance/accounts';
import {
  accountForPaymentMethod,
  BANK_TRANSFER_PAYMENT_METHOD,
  CARD_PAYMENT_METHOD,
  CASH_PAYMENT_METHOD,
  isCashPaymentMethod,
} from '../../src/lib/cashPayment';

const empty: AccountsInput = {
  openingBank: 0,
  openingCard: 0,
  cashClosingBalance: 0,
  bankDepositsIn: [],
  cashierWithdrawalsOut: [],
  cardAtmWithdrawalsOut: [],
  transfersBankToCard: [],
  bankExpenses: [],
  cardExpenses: [],
};

describe('computeAccountBalances', () => {
  it('uses cash drawer closing balance for cash', () => {
    const result = computeAccountBalances({ ...empty, cashClosingBalance: 250.5 });
    expect(result.cash).toBe(250.5);
  });

  it('computes bank balance from opening, deposits, withdrawals, transfers, expenses', () => {
    const result = computeAccountBalances({
      ...empty,
      openingBank: 5000,
      bankDepositsIn: [{ date: '2026-06-10', amount: 200 }],
      cashierWithdrawalsOut: [{ date: '2026-06-11', amount: 100 }],
      transfersBankToCard: [{ date: '2026-06-12', amount: 300 }],
      bankExpenses: [{ date: '2026-06-13', amount: 50 }],
    });
    expect(result.bank).toBe(4750); // 5000 + 200 - 100 - 300 - 50
  });

  it('computes card balance from opening, transfers in, ATM withdrawals, card expenses', () => {
    const result = computeAccountBalances({
      ...empty,
      openingCard: 1000,
      transfersBankToCard: [{ date: '2026-06-12', amount: 300 }],
      cardAtmWithdrawalsOut: [{ date: '2026-06-14', amount: 150 }],
      cardExpenses: [{ date: '2026-06-15', amount: 25 }],
    });
    expect(result.card).toBe(1125); // 1000 + 300 - 150 - 25
  });

  it('deducts paid-now bank and card purchases from their accounts', () => {
    const result = computeAccountBalances({
      ...empty,
      openingBank: 1000,
      openingCard: 500,
      bankPurchases: [{ date: '2026-06-16', amount: 120 }],
      cardPurchases: [{ date: '2026-06-17', amount: 40 }],
    });
    expect(result.bank).toBe(880); // 1000 - 120
    expect(result.card).toBe(460); // 500 - 40
  });

  it('credits bank and card payouts received into each account', () => {
    const result = computeAccountBalances({
      ...empty,
      openingBank: 1000,
      openingCard: 200,
      bankPayoutsIn: [{ date: '2026-06-30', amount: 450 }],
      cardPayoutsIn: [{ date: '2026-06-30', amount: 120 }],
    });
    expect(result.bank).toBe(1450); // 1000 + 450
    expect(result.card).toBe(320); // 200 + 120
  });

  it('internal transfer reduces bank and increases card by the same amount', () => {
    const transfer = [{ date: '2026-06-01', amount: 400 }];
    const result = computeAccountBalances({
      ...empty,
      openingBank: 2000,
      openingCard: 500,
      transfersBankToCard: transfer,
    });
    expect(result.bank).toBe(1600);
    expect(result.card).toBe(900);
    expect(result.bank + result.card).toBe(2500);
  });
});

describe('accountForPaymentMethod', () => {
  it('maps canonical and legacy tokens', () => {
    expect(accountForPaymentMethod(CASH_PAYMENT_METHOD)).toBe('cash');
    expect(accountForPaymentMethod(CARD_PAYMENT_METHOD)).toBe('card');
    expect(accountForPaymentMethod(BANK_TRANSFER_PAYMENT_METHOD)).toBe('bank');
    expect(isCashPaymentMethod('Nağd')).toBe(true);
    expect(accountForPaymentMethod('Bank Transfer')).toBe('bank');
    expect(accountForPaymentMethod('card_online')).toBe('card');
  });

  it('returns null for unknown methods', () => {
    expect(accountForPaymentMethod('')).toBe(null);
    expect(accountForPaymentMethod(null)).toBe(null);
    expect(accountForPaymentMethod('paypal')).toBe(null);
  });
});
