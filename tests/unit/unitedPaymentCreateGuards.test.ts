import { describe, expect, it } from 'vitest';
import {
  evaluateUnitedPaymentCreateGuards,
  PAYMENT_INIT_TOKEN_TTL_MS,
  type UnitedPaymentCreateSale,
} from '../../supabase/functions/_shared/unitedPaymentCreateGuards.ts';

function pendingSale(over: Partial<UnitedPaymentCreateSale> = {}): UnitedPaymentCreateSale {
  return {
    source: 'online_delivery',
    payment_status: 'pending',
    payment_init_token: 'tok-1',
    created_at: new Date('2026-09-15T10:00:00.000Z').toISOString(),
    online_payment_id: null,
    customer_user_id: null,
    total_price: 24.5,
    ...over,
  };
}

const nowMs = Date.parse('2026-09-15T10:05:00.000Z');

describe('evaluateUnitedPaymentCreateGuards', () => {
  it('unit-up-create-payment-rejects-second-init: online_payment_id already set is 409', () => {
    const result = evaluateUnitedPaymentCreateGuards(
      pendingSale({ online_payment_id: 'pay-already' }),
      { paymentInitToken: 'tok-1', nowMs }
    );
    expect(result).toEqual({
      ok: false,
      status: 409,
      error: 'Payment already initialized for this sale',
    });
  });

  it('allows the first init when pending and token is valid', () => {
    const result = evaluateUnitedPaymentCreateGuards(pendingSale(), {
      paymentInitToken: 'tok-1',
      nowMs,
    });
    expect(result).toEqual({ ok: true, amount: 24.5 });
  });

  it('rejects non-pending payment_status', () => {
    const result = evaluateUnitedPaymentCreateGuards(pendingSale({ payment_status: 'paid' }), {
      paymentInitToken: 'tok-1',
      nowMs,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it('rejects a bad payment init token', () => {
    const result = evaluateUnitedPaymentCreateGuards(pendingSale(), {
      paymentInitToken: 'wrong',
      nowMs,
    });
    expect(result).toEqual({ ok: false, status: 403, error: 'Invalid payment init token' });
  });

  it('rejects an expired payment init token', () => {
    const result = evaluateUnitedPaymentCreateGuards(pendingSale(), {
      paymentInitToken: 'tok-1',
      nowMs: Date.parse('2026-09-15T10:00:00.000Z') + PAYMENT_INIT_TOKEN_TTL_MS + 1,
    });
    expect(result).toEqual({ ok: false, status: 410, error: 'paymentInitToken expired' });
  });
});
