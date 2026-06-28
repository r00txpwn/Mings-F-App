import { describe, it, expect } from 'vitest';
import {
  allocateManualDebtPaymentsFIFO,
  allocatePaymentsFIFO,
  allocatePaymentsFIFOFromOpening,
  computeSupplierCreditBalance,
  computeSupplierOutstanding,
} from '../../src/services/finance/supplierLedger';
import { derivePurchaseLedgerStatus } from '../../src/services/finance/purchaseCredit';

describe('computeSupplierOutstanding', () => {
  it('sums manual debts + purchases - payments', () => {
    expect(
      computeSupplierOutstanding({
        manualDebts: [1200],
        creditPurchases: [300, 200],
        payments: [500],
      }),
    ).toBe(1200);
  });

  it('never returns negative outstanding', () => {
    expect(
      computeSupplierOutstanding({
        manualDebts: [250],
        creditPurchases: [],
        payments: [750],
      }),
    ).toBe(0);
  });
});

describe('computeSupplierCreditBalance', () => {
  it('returns surplus when payments exceed debt', () => {
    expect(
      computeSupplierCreditBalance({
        manualDebts: [],
        creditPurchases: [250],
        payments: [750],
      }),
    ).toBe(500);
  });

  it('returns zero when debt exceeds payments', () => {
    expect(
      computeSupplierCreditBalance({
        manualDebts: [100],
        creditPurchases: [250],
        payments: [200],
      }),
    ).toBe(0);
  });
});

describe('derivePurchaseLedgerStatus', () => {
  it('marks paid-now purchases as paid regardless of account payments', () => {
    expect(
      derivePurchaseLedgerStatus({
        is_on_credit: false,
        payment_status: 'paid',
        total: 250,
      }),
    ).toEqual({ paid: 250, status: 'paid' });
  });

  it('marks on-account purchases as unpaid from their own record', () => {
    expect(
      derivePurchaseLedgerStatus({
        is_on_credit: true,
        payment_status: 'pending',
        total: 250,
      }),
    ).toEqual({ paid: 0, status: 'unpaid' });
  });
});

describe('allocateManualDebtPaymentsFIFO', () => {
  const manualDebts = [{ id: 'd1', total: 1200, debtDate: '2026-06-01' }];

  it('applies payments to manual debts only', () => {
    const result = allocateManualDebtPaymentsFIFO(manualDebts, 500);
    expect(result.manualDebts[0]).toMatchObject({ id: 'd1', status: 'partial', paid: 500 });
    expect(result.totalRemaining).toBe(700);
  });

  it('marks manual debt paid when fully covered', () => {
    const result = allocateManualDebtPaymentsFIFO(manualDebts, 1200);
    expect(result.manualDebts[0]).toMatchObject({ id: 'd1', status: 'paid', paid: 1200 });
    expect(result.totalRemaining).toBe(0);
  });
});

describe('allocatePaymentsFIFO', () => {
  const manualDebts = [{ id: 'd1', total: 1200, debtDate: '2026-06-01' }];
  const purchases = [
    { id: 'p1', total: 300, purchaseDate: '2026-07-03' },
    { id: 'p2', total: 200, purchaseDate: '2026-07-09' },
  ];

  it('allocates manual debts via FIFO but leaves purchases unpaid', () => {
    const result = allocatePaymentsFIFO(manualDebts, purchases, 1500);
    expect(result.manualDebts[0]).toMatchObject({ id: 'd1', status: 'paid', paid: 1200 });
    expect(result.purchases.every((p) => p.status === 'unpaid' && p.paid === 0)).toBe(true);
  });
});

describe('allocatePaymentsFIFOFromOpening', () => {
  const purchases = [
    { id: 'p1', total: 300, purchaseDate: '2026-07-03' },
    { id: 'p2', total: 200, purchaseDate: '2026-07-09' },
  ];

  it('applies payments to opening balance first', () => {
    const result = allocatePaymentsFIFOFromOpening(1200, purchases, 500);
    expect(result.openingPaid).toBe(500);
    expect(result.openingRemaining).toBe(700);
    expect(result.purchases.every((p) => p.status === 'unpaid')).toBe(true);
  });
});
