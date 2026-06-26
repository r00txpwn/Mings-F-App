import { describe, it, expect } from 'vitest';
import {
  allocatePaymentsFIFO,
  computeSupplierOutstanding,
} from '../../src/services/finance/supplierLedger';

describe('computeSupplierOutstanding', () => {
  it('sums opening balance + purchases - payments', () => {
    expect(
      computeSupplierOutstanding({
        openingBalance: 1200,
        creditPurchases: [300, 200],
        payments: [500],
      }),
    ).toBe(1200);
  });
});

describe('allocatePaymentsFIFO', () => {
  const purchases = [
    { id: 'p1', total: 300, purchaseDate: '2026-07-03' },
    { id: 'p2', total: 200, purchaseDate: '2026-07-09' },
  ];

  it('applies payments to opening balance first', () => {
    const result = allocatePaymentsFIFO(1200, purchases, 500);
    expect(result.openingPaid).toBe(500);
    expect(result.openingRemaining).toBe(700);
    expect(result.purchases.every((p) => p.status === 'unpaid')).toBe(true);
  });

  it('rolls overpayment into oldest purchases', () => {
    const result = allocatePaymentsFIFO(1200, purchases, 1500);
    expect(result.openingPaid).toBe(1200);
    expect(result.openingRemaining).toBe(0);
    expect(result.purchases[0]).toMatchObject({ id: 'p1', status: 'paid', paid: 300 });
    expect(result.purchases[1]).toMatchObject({ id: 'p2', status: 'unpaid', paid: 0 });
  });

  it('marks partial when payment covers part of oldest purchase after opening', () => {
    const result = allocatePaymentsFIFO(0, purchases, 150);
    expect(result.purchases[0]).toMatchObject({ id: 'p1', status: 'partial', paid: 150 });
    expect(result.purchases[1]).toMatchObject({ id: 'p2', status: 'unpaid', paid: 0 });
  });
});
