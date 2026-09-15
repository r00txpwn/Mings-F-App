import { describe, expect, it } from 'vitest';
import { onlineOrderCreatePaymentContract } from '../../supabase/functions/_shared/onlinePaymentMethod.ts';
import { cardPaymentInitHandoff } from '../../src/order/storefrontPaymentHandoff';

describe('onlineOrderCreatePaymentContract', () => {
  it('unit-order-create-nextStep-card-vs-cod: card goes to united-payment-create-payment as pending', () => {
    const card = onlineOrderCreatePaymentContract('card_online', 'takeaway');
    expect(card).toEqual({
      paymentMethod: 'card_online',
      cardPayment: true,
      paymentStatus: 'pending',
      nextStep: 'united-payment-create-payment',
    });
  });

  it('unit-order-create-nextStep-card-vs-cod: COD takeaway is unpaid cash_pickup → track', () => {
    const cod = onlineOrderCreatePaymentContract('cod', 'takeaway');
    expect(cod).toEqual({
      paymentMethod: 'cash_pickup',
      cardPayment: false,
      paymentStatus: 'unpaid',
      nextStep: 'track',
    });
  });

  it('unit-order-create-nextStep-card-vs-cod: COD delivery is unpaid cash_delivery → track', () => {
    const cod = onlineOrderCreatePaymentContract('cod', 'delivery');
    expect(cod).toEqual({
      paymentMethod: 'cash_delivery',
      cardPayment: false,
      paymentStatus: 'unpaid',
      nextStep: 'track',
    });
  });

  it('unit-order-create-nextStep-card-vs-cod: ok-without-checkoutUrl is fail-closed (not placed)', () => {
    const card = onlineOrderCreatePaymentContract('card_online', 'delivery');
    expect(card.nextStep).toBe('united-payment-create-payment');
    const handoff = cardPaymentInitHandoff({ ok: true, data: {} });
    expect(handoff.action).toBe('fail_closed');
  });
});
