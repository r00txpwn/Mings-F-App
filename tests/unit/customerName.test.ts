import { describe, expect, it } from 'vitest';
import {
  getCustomerFullNameValidation,
  normalizeCustomerFullName,
  toCustomerFullNamePatch,
} from '../../src/order/customerName';

describe('customer name helpers', () => {
  it('normalizes surrounding and repeated whitespace', () => {
    expect(normalizeCustomerFullName('  QA   Final   Name 2026  ')).toBe('QA Final Name 2026');
  });

  it('blocks blank and numeric-only names', () => {
    expect(getCustomerFullNameValidation('   ')).toEqual({ valid: false, reason: 'required' });
    expect(getCustomerFullNameValidation('123456')).toEqual({ valid: false, reason: 'invalid' });
  });

  it('accepts non-Latin customer names', () => {
    expect(getCustomerFullNameValidation('Алиса')).toEqual({ valid: true, normalized: 'Алиса' });
  });

  it('builds a canonical full_name patch only for valid changed names', () => {
    expect(toCustomerFullNamePatch('QA Final Name 2026', 'QA Persist')).toEqual({
      full_name: 'QA Final Name 2026',
    });
    expect(toCustomerFullNamePatch('QA Persist', 'QA Persist')).toBeNull();
    expect(toCustomerFullNamePatch('123456', 'QA Persist')).toBeNull();
  });
});
