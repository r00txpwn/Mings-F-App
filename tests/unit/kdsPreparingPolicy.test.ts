import { describe, expect, it } from 'vitest';
import { evaluateKdsPreparingTransition } from '../../supabase/functions/_shared/kdsPreparingPolicy.ts';

describe('evaluateKdsPreparingTransition', () => {
  it('unit-kds-status-preparing-requires-paid-card: pending+card+unpaid is 409 PAYMENT_NOT_CONFIRMED', () => {
    const result = evaluateKdsPreparingTransition({
      order_status: 'pending',
      source: 'online_delivery',
      online_payment_method: 'card_online',
      payment_status: 'pending',
    });
    expect(result).toEqual({
      ok: false,
      status: 409,
      code: 'PAYMENT_NOT_CONFIRMED',
      message: 'Card payment must be confirmed before preparing',
    });
  });

  it('unit-kds-status-preparing-requires-paid-card: pending+card+paid is allowed', () => {
    const result = evaluateKdsPreparingTransition({
      order_status: 'pending',
      source: 'online_takeaway',
      online_payment_method: 'card_online',
      payment_status: 'paid',
    });
    expect(result).toEqual({ ok: true });
  });

  it('rejects preparing when order_status is not pending', () => {
    const result = evaluateKdsPreparingTransition({
      order_status: 'ready',
      source: 'online_takeaway',
      online_payment_method: 'card_online',
      payment_status: 'paid',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('INVALID_STATE');
  });

  it('unit-cod-may-cook-without-paid: unpaid cash_delivery pending may start preparing', () => {
    expect(
      evaluateKdsPreparingTransition({
        order_status: 'pending',
        source: 'online_delivery',
        online_payment_method: 'cash_delivery',
        payment_status: 'unpaid',
      })
    ).toEqual({ ok: true });
  });
});
