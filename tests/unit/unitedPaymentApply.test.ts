import { describe, expect, it } from 'vitest';
import { paymentConfirmedForKdsPrep } from '../../supabase/functions/_shared/onlinePaymentMethod.ts';
import {
  applyUnitedPaymentNotify,
  type UnitedPaymentApplyDb,
  type UnitedPaymentApplyRow,
} from '../../supabase/functions/_shared/unitedPaymentApply.ts';
import { evaluateUnitedPaymentCreateGuards } from '../../supabase/functions/_shared/unitedPaymentCreateGuards.ts';

type SaleState = {
  id: string;
  payment_status: string;
  order_status: string;
  source: string;
  online_payment_method: string;
  online_payment_id: string | null;
};

function memoryApplyDb(init: {
  payment: UnitedPaymentApplyRow;
  sale: SaleState;
}): {
  db: UnitedPaymentApplyDb;
  payment: UnitedPaymentApplyRow;
  sale: SaleState;
  writes: Array<{ kind: string }>;
  chargeInits: number;
} {
  const payment = { ...init.payment };
  const sale = { ...init.sale };
  const writes: Array<{ kind: string }> = [];
  const chargeInits = 0;
  const db: UnitedPaymentApplyDb = {
    async updateOnlinePayment(_id, patch) {
      writes.push({ kind: 'online_payments.update' });
      Object.assign(payment, patch);
    },
    async markSalePaid() {
      writes.push({ kind: 'sales.paid' });
      sale.payment_status = 'paid';
    },
    async setSaleOrderPendingIfAwaiting() {
      if (sale.order_status === 'awaiting_payment' || sale.order_status === 'pending') {
        writes.push({ kind: 'sales.order_pending' });
        sale.order_status = 'pending';
      }
    },
    async markSaleFailed() {
      writes.push({ kind: 'sales.failed' });
      sale.payment_status = 'failed';
    },
  };
  return { db, payment, sale, writes, chargeInits };
}

function pendingCardSale(): { payment: UnitedPaymentApplyRow; sale: SaleState } {
  return {
    payment: {
      id: 'pay-1',
      sale_id: 'sale-1',
      status: 'pending',
      external_id: 'up_sale-1_1',
      epoint_transaction: 'tx-1',
    },
    sale: {
      id: 'sale-1',
      payment_status: 'pending',
      order_status: 'awaiting_payment',
      source: 'online_takeaway',
      online_payment_method: 'card_online',
      online_payment_id: 'pay-1',
    },
  };
}

describe('unitedPaymentApply', () => {
  it('unit-up-mark-paid-enables-kds-prep: successful UP apply marks sale paid so KDS may-cook is true', async () => {
    const mem = memoryApplyDb(pendingCardSale());
    const first = await applyUnitedPaymentNotify(
      mem.db,
      mem.payment,
      'APPROVED',
      { source: 'united-payment-webhook' },
      'tx-1'
    );
    expect(first.skippedDuplicate).toBe(false);
    expect(first.mapped).toBe('success');
    expect(mem.payment.status).toBe('success');
    expect(mem.sale.payment_status).toBe('paid');
    expect(mem.sale.order_status).toBe('pending');
    expect(
      paymentConfirmedForKdsPrep({
        source: mem.sale.source,
        onlinePaymentMethod: mem.sale.online_payment_method,
        paymentStatus: mem.sale.payment_status,
      })
    ).toBe(true);
  });

  it('unit-payment-idempotency-duplicate-success: second success notify does not double-apply or open a second charge', async () => {
    const mem = memoryApplyDb(pendingCardSale());
    await applyUnitedPaymentNotify(mem.db, mem.payment, 'APPROVED', { source: 'return' }, 'tx-1');
    const paidWritesAfterFirst = mem.writes.filter((w) => w.kind === 'sales.paid').length;
    expect(paidWritesAfterFirst).toBe(1);

    const second = await applyUnitedPaymentNotify(
      mem.db,
      mem.payment,
      'APPROVED',
      { source: 'webhook' },
      'tx-1'
    );
    expect(second.skippedDuplicate).toBe(true);
    expect(second.mapped).toBe('success');
    expect(mem.writes.filter((w) => w.kind === 'sales.paid')).toHaveLength(1);
    expect(mem.writes.filter((w) => w.kind === 'online_payments.update')).toHaveLength(1);
    expect(mem.chargeInits).toBe(0);

    const relock = evaluateUnitedPaymentCreateGuards(
      {
        source: mem.sale.source,
        payment_status: mem.sale.payment_status,
        payment_init_token: 'tok',
        created_at: new Date().toISOString(),
        online_payment_id: mem.sale.online_payment_id,
        customer_user_id: null,
        total_price: 12,
      },
      { paymentInitToken: 'tok' }
    );
    expect(relock.ok).toBe(false);
    if (!relock.ok) {
      expect(relock.status).toBe(400);
    }
  });
});
