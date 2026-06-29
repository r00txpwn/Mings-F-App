import { describe, it, expect } from 'vitest';
import { computeCashDrawer, type CashDrawerInput } from '../../src/services/finance/cashDrawer';
import { isCashPaymentMethod } from '../../src/lib/cashPayment';

const empty: CashDrawerInput = {
  orderCashIn: [],
  bankWithdrawalsIn: [],
  movementsIn: [],
  cashExpenses: [],
  cashSupplierPayments: [],
  cashLiabilityPayments: [],
  movementsOut: [],
};

describe('computeCashDrawer', () => {
  it('all-time: closing = ins - outs with zero opening', () => {
    const result = computeCashDrawer({
      ...empty,
      orderCashIn: [{ date: '2026-06-01', amount: 100 }, { date: '2026-06-15', amount: 50 }],
      movementsIn: [{ date: '2026-06-01', amount: 200 }], // opening float
      cashExpenses: [{ date: '2026-06-10', amount: 30 }],
      cashSupplierPayments: [{ date: '2026-06-12', amount: 40 }],
      cashLiabilityPayments: [{ date: '2026-06-13', amount: 10 }],
      movementsOut: [{ date: '2026-06-20', amount: 60 }], // bank deposit
    });
    expect(result.openingBalance).toBe(0);
    expect(result.cashIn.total).toBe(350); // 150 orders + 200 float
    expect(result.cashOut.total).toBe(140); // 30 + 40 + 10 + 60
    expect(result.netChange).toBe(210);
    expect(result.closingBalance).toBe(210);
  });

  it('folds pre-period activity into openingBalance', () => {
    const input: CashDrawerInput = {
      ...empty,
      orderCashIn: [
        { date: '2026-05-31', amount: 100 }, // before period
        { date: '2026-06-05', amount: 80 }, // in period
      ],
      cashExpenses: [{ date: '2026-05-20', amount: 30 }], // before period
      movementsOut: [{ date: '2026-06-25', amount: 50 }], // in period
    };
    const result = computeCashDrawer(input, '2026-06-01', '2026-06-30');
    expect(result.openingBalance).toBe(70); // 100 - 30
    expect(result.cashIn.total).toBe(80);
    expect(result.cashOut.total).toBe(50);
    expect(result.netChange).toBe(30);
    expect(result.closingBalance).toBe(100); // 70 + 30
  });

  it('excludes entries after endDate', () => {
    const result = computeCashDrawer(
      { ...empty, orderCashIn: [{ date: '2026-07-01', amount: 999 }] },
      '2026-06-01',
      '2026-06-30',
    );
    expect(result.cashIn.total).toBe(0);
    expect(result.closingBalance).toBe(0);
  });

  it('adds net bank withdrawals (amount − fee) as cash in', () => {
    const result = computeCashDrawer({
      ...empty,
      bankWithdrawalsIn: [{ date: '2026-06-10', amount: 497.5 }], // ₼500 withdrawal − ₼2.50 fee
    });
    expect(result.cashIn.bankWithdrawals).toBe(497.5);
    expect(result.cashIn.total).toBe(497.5);
    expect(result.closingBalance).toBe(497.5);
  });

  it('breaks down cash-out by source', () => {
    const result = computeCashDrawer({
      ...empty,
      cashExpenses: [{ date: '2026-06-02', amount: 12.5 }],
      cashSupplierPayments: [{ date: '2026-06-03', amount: 7.25 }],
      cashLiabilityPayments: [{ date: '2026-06-04', amount: 1.25 }],
    });
    expect(result.cashOut.expenses).toBe(12.5);
    expect(result.cashOut.supplierPayments).toBe(7.25);
    expect(result.cashOut.liabilityPayments).toBe(1.25);
    expect(result.cashOut.purchases).toBe(0);
    expect(result.cashOut.total).toBe(21);
  });

  it('adds cash payouts received as cash in', () => {
    const result = computeCashDrawer({
      ...empty,
      payoutsIn: [
        { date: '2026-06-10', amount: 300 },
        { date: '2026-06-12', amount: 75.5 },
      ],
    });
    expect(result.cashIn.payouts).toBe(375.5);
    expect(result.cashIn.total).toBe(375.5);
    expect(result.closingBalance).toBe(375.5);
  });

  it('deducts paid-now cash purchases from the drawer', () => {
    const result = computeCashDrawer({
      ...empty,
      movementsIn: [{ date: '2026-06-01', amount: 500 }], // opening float
      cashPurchases: [
        { date: '2026-06-05', amount: 80 },
        { date: '2026-06-06', amount: 20.5 },
      ],
    });
    expect(result.cashOut.purchases).toBe(100.5);
    expect(result.cashOut.total).toBe(100.5);
    expect(result.closingBalance).toBe(399.5);
  });

  it('treats non-finite amounts as zero', () => {
    const result = computeCashDrawer({
      ...empty,
      orderCashIn: [{ date: '2026-06-01', amount: Number.NaN }],
    });
    expect(result.closingBalance).toBe(0);
  });
});

describe('isCashPaymentMethod', () => {
  it('matches explicit and localized cash tokens', () => {
    expect(isCashPaymentMethod('cash')).toBe(true);
    expect(isCashPaymentMethod('CASH')).toBe(true);
    expect(isCashPaymentMethod('cod')).toBe(true);
    expect(isCashPaymentMethod('cash_pickup')).toBe(true);
    expect(isCashPaymentMethod('cash_delivery')).toBe(true);
    expect(isCashPaymentMethod('Nağd')).toBe(true);
    expect(isCashPaymentMethod('наличными')).toBe(true);
  });

  it('rejects card and empty values', () => {
    expect(isCashPaymentMethod('card')).toBe(false);
    expect(isCashPaymentMethod('card_online')).toBe(false);
    expect(isCashPaymentMethod('epoint')).toBe(false);
    expect(isCashPaymentMethod('')).toBe(false);
    expect(isCashPaymentMethod(null)).toBe(false);
    expect(isCashPaymentMethod(undefined)).toBe(false);
  });
});
