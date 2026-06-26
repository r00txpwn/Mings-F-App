import { describe, expect, it } from 'vitest';
import { paymentConfirmedForKdsPrep } from '../../supabase/functions/_shared/onlinePaymentMethod.ts';

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
