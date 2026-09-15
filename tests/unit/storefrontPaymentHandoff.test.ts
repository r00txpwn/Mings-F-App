import { describe, expect, it } from 'vitest';
import {
  hostedCheckoutUrlFromInit,
  parseStorefrontPaymentReturn,
  placedOrderFromSaleRow,
  shouldClearCartOnPaymentReturn,
  stripStorefrontPaymentReturnParams,
} from '../../src/order/storefrontPaymentHandoff';

describe('hostedCheckoutUrlFromInit', () => {
  it('fail-closes when init is ok but checkoutUrl is missing', () => {
    expect(hostedCheckoutUrlFromInit({ })).toBeNull();
    expect(hostedCheckoutUrlFromInit({ checkoutUrl: '' })).toBeNull();
    expect(hostedCheckoutUrlFromInit({ checkoutUrl: '   ' })).toBeNull();
    expect(hostedCheckoutUrlFromInit(null)).toBeNull();
  });

  it('returns a usable hosted checkout URL when present', () => {
    expect(hostedCheckoutUrlFromInit({ checkoutUrl: 'https://pay.example/session' })).toBe(
      'https://pay.example/session'
    );
  });
});

describe('parseStorefrontPaymentReturn', () => {
  it('reads paid=1 with sale id and never treats it as pending', () => {
    const parsed = parseStorefrontPaymentReturn('paid=1&sale=sale-1&payment_pending=1');
    expect(parsed).toEqual({ status: 'paid', saleId: 'sale-1', message: null });
    expect(shouldClearCartOnPaymentReturn(parsed.status)).toBe(true);
  });

  it('reads payment_error=1 and keeps cart', () => {
    const parsed = parseStorefrontPaymentReturn(
      'payment_error=1&sale=sale-2&message=Payment+cancelled'
    );
    expect(parsed).toEqual({
      status: 'error',
      saleId: 'sale-2',
      message: 'Payment cancelled',
    });
    expect(shouldClearCartOnPaymentReturn(parsed.status)).toBe(false);
  });

  it('reads payment_pending=1 instead of ignoring it, and never treats it as paid', () => {
    const parsed = parseStorefrontPaymentReturn('payment_pending=1&sale=sale-3');
    expect(parsed.status).toBe('pending');
    expect(parsed.saleId).toBe('sale-3');
    expect(shouldClearCartOnPaymentReturn(parsed.status)).toBe(false);
  });

  it('returns none when no payment return flags are present', () => {
    expect(parseStorefrontPaymentReturn('table=12')).toEqual({
      status: 'none',
      saleId: null,
      message: null,
    });
  });
});

describe('stripStorefrontPaymentReturnParams', () => {
  it('removes payment return params and keeps unrelated query keys', () => {
    const params = new URLSearchParams(
      'paid=1&sale=abc&payment_error=1&payment_pending=1&message=x&table=5'
    );
    const stripped = stripStorefrontPaymentReturnParams(params);
    expect(stripped.get('table')).toBe('5');
    expect(stripped.get('paid')).toBeNull();
    expect(stripped.get('sale')).toBeNull();
    expect(stripped.get('payment_error')).toBeNull();
    expect(stripped.get('payment_pending')).toBeNull();
    expect(stripped.get('message')).toBeNull();
  });
});

describe('placedOrderFromSaleRow', () => {
  it('maps saleId and trackToken from a refetched sale row', () => {
    expect(
      placedOrderFromSaleRow({
        id: 'sale-9',
        display_number: '1042',
        track_token: 'tok-9',
      })
    ).toEqual({
      saleId: 'sale-9',
      displayNumber: '1042',
      trackToken: 'tok-9',
    });
  });

  it('returns null when there is no sale to land on', () => {
    expect(placedOrderFromSaleRow(null)).toBeNull();
    expect(placedOrderFromSaleRow({ id: '' })).toBeNull();
  });
});
