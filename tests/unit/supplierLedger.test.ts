import { describe, it, expect } from 'vitest';
import {
  allocatePaymentsFIFO,
  allocatePaymentsFIFOFromOpening,
  computeSupplierOutstanding,
} from '../../src/services/finance/supplierLedger';

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
});

describe('allocatePaymentsFIFO', () => {
  const manualDebts = [{ id: 'd1', total: 1200, debtDate: '2026-06-01' }];
  const purchases = [
    { id: 'p1', total: 300, purchaseDate: '2026-07-03' },
    { id: 'p2', total: 200, purchaseDate: '2026-07-09' },
  ];

  it('applies payments to oldest debt lines first (manual before later purchases)', () => {
    const result = allocatePaymentsFIFO(manualDebts, purchases, 500);
    expect(result.manualDebts[0]).toMatchObject({ id: 'd1', status: 'partial', paid: 500 });
    expect(result.purchases.every((p) => p.status === 'unpaid')).toBe(true);
    expect(result.totalRemaining).toBe(1200);
  });

  it('rolls overpayment into purchases after manual debts cleared', () => {
    const result = allocatePaymentsFIFO(manualDebts, purchases, 1500);
    expect(result.manualDebts[0]).toMatchObject({ id: 'd1', status: 'paid', paid: 1200 });
    expect(result.purchases[0]).toMatchObject({ id: 'p1', status: 'paid', paid: 300 });
    expect(result.purchases[1]).toMatchObject({ id: 'p2', status: 'unpaid', paid: 0 });
  });

  it('marks partial when payment covers part of oldest purchase only', () => {
    const result = allocatePaymentsFIFO([], purchases, 150);
    expect(result.purchases[0]).toMatchObject({ id: 'p1', status: 'partial', paid: 150 });
    expect(result.purchases[1]).toMatchObject({ id: 'p2', status: 'unpaid', paid: 0 });
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
