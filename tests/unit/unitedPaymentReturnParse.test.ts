import { describe, expect, it } from 'vitest';
import {
  mapProviderStatus,
  parseUnitedPaymentReturn,
} from '../../supabase/functions/_shared/unitedPaymentReturnParse.ts';

/** Sample redirect payload from United Payment TEST EN Postman collection. */
const APPROVED_PAYLOAD = {
  OrderId: 'string342353423',
  Status: 'APPROVED',
  Transaction: 39918,
  BankTransaction: '798048',
  BankOrderId: '798048',
  BankSessionId: '506980E3ED1015464E2D7589B1BE53DE',
};

function toBase64(obj: Record<string, unknown>): string {
  return btoa(JSON.stringify(obj));
}

describe('parseUnitedPaymentReturn', () => {
  it('decodes base64 up query param', () => {
    const up = toBase64(APPROVED_PAYLOAD);
    const params = new URLSearchParams({ up });
    const parsed = parseUnitedPaymentReturn(params);
    expect(parsed.clientOrderId).toBe('string342353423');
    expect(parsed.transactionId).toBe('39918');
    expect(parsed.status).toBe('APPROVED');
    expect(parsed.source).toBe('up_param');
  });

  it('reads plain JSON body fields', () => {
    const parsed = parseUnitedPaymentReturn({
      clientOrderId: 'up_sale_1',
      transactionId: '105769',
      status: 'Pending',
    });
    expect(parsed.clientOrderId).toBe('up_sale_1');
    expect(parsed.transactionId).toBe('105769');
    expect(parsed.status).toBe('Pending');
  });

  it('parses form body with up=', () => {
    const up = toBase64({ OrderId: 'o1', Status: 'DECLINED', Transaction: 42 });
    const parsed = parseUnitedPaymentReturn(`up=${encodeURIComponent(up)}`);
    expect(parsed.clientOrderId).toBe('o1');
    expect(parsed.status).toBe('DECLINED');
    expect(parsed.transactionId).toBe('42');
  });
});

describe('mapProviderStatus', () => {
  it('maps APPROVED and 001 to success', () => {
    expect(mapProviderStatus('APPROVED')).toBe('success');
    expect(mapProviderStatus('001')).toBe('success');
  });

  it('maps decline/cancel to failed', () => {
    expect(mapProviderStatus('DECLINED')).toBe('failed');
    expect(mapProviderStatus('CANCELLED')).toBe('failed');
  });

  it('maps unknown to pending', () => {
    expect(mapProviderStatus('Pending')).toBe('pending');
    expect(mapProviderStatus('')).toBe('pending');
  });
});
