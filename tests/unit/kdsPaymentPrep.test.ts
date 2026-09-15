import { describe, expect, it } from 'vitest';
import { paymentConfirmedForKdsPrep, normalizePaymentMethodForPersist } from '../../supabase/functions/_shared/onlinePaymentMethod.ts';

describe('paymentConfirmedForKdsPrep', () => {
  it('blocks unpaid card online orders', () => {
    expect(
      paymentConfirmedForKdsPrep({
        source: 'online_takeaway',
        onlinePaymentMethod: 'card_online',
        paymentStatus: 'pending',
      })
    ).toBe(false);
  });

  it('allows paid card online orders', () => {
    expect(
      paymentConfirmedForKdsPrep({
        source: 'online_delivery',
        onlinePaymentMethod: 'card_online',
        paymentStatus: 'paid',
      })
    ).toBe(true);
  });

  it('allows cash pickup with unpaid status', () => {
    expect(
      paymentConfirmedForKdsPrep({
        source: 'online_takeaway',
        onlinePaymentMethod: 'cash_pickup',
        paymentStatus: 'unpaid',
      })
    ).toBe(true);
  });

  it('unit-cod-may-cook-without-paid: COD normalizes to cash_* and unpaid cash may-cook', () => {
    expect(normalizePaymentMethodForPersist('cod', 'takeaway')).toBe('cash_pickup');
    expect(normalizePaymentMethodForPersist('cod', 'delivery')).toBe('cash_delivery');
    expect(
      paymentConfirmedForKdsPrep({
        source: 'online_delivery',
        onlinePaymentMethod: 'cash_delivery',
        paymentStatus: 'unpaid',
      })
    ).toBe(true);
    expect(
      paymentConfirmedForKdsPrep({
        source: 'online_takeaway',
        onlinePaymentMethod: 'cash_pickup',
        paymentStatus: 'pending',
      })
    ).toBe(true);
  });

  it('blocks unpaid kiosk orders', () => {
    expect(
      paymentConfirmedForKdsPrep({
        source: 'kiosk',
        onlinePaymentMethod: null,
        paymentStatus: 'pending',
      })
    ).toBe(false);
  });
});
