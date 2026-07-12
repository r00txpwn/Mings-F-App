import { describe, expect, it } from 'vitest';
import {
  assertDirectOrderRequestLimits,
  assertLineQuantity,
  assertUniqueModifierIds,
  cartStats,
  DIRECT_ORDER_LIMITS,
  isValidUuid,
} from '../../src/lib/directOrderValidation';

describe('directOrderValidation limits', () => {
  it('accepts requests within caps', () => {
    const result = assertDirectOrderRequestLimits('{}', 5, 10, 3);
    expect(result.ok).toBe(true);
  });

  it('rejects oversized body', () => {
    const big = 'x'.repeat(DIRECT_ORDER_LIMITS.maxBodyBytes + 1);
    const result = assertDirectOrderRequestLimits(big, 1, 1, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('REQUEST_TOO_LARGE');
  });

  it('rejects too many cart lines', () => {
    const result = assertDirectOrderRequestLimits('{}', DIRECT_ORDER_LIMITS.maxCartLines + 1, 1, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('CART_LINE_LIMIT');
  });

  it('rejects duplicate modifier ids', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    expect(() => assertUniqueModifierIds([id, id])).toThrow('DUPLICATE_MODIFIER_ID');
  });

  it('rejects malformed uuid modifier ids', () => {
    expect(() => assertUniqueModifierIds(['not-a-uuid'])).toThrow('INVALID_MODIFIER_ID');
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('bounds line quantity', () => {
    expect(assertLineQuantity(2)).toBe(2);
    expect(() => assertLineQuantity(0)).toThrow('INVALID_LINE_QUANTITY');
    expect(() => assertLineQuantity(100)).toThrow('INVALID_LINE_QUANTITY');
  });

  it('computes cart stats', () => {
    const stats = cartStats([
      { quantity: 2, modifierOptionIds: ['a', 'b'] },
      { quantity: 3, modifierOptionIds: ['c'] },
    ]);
    expect(stats.lineCount).toBe(2);
    expect(stats.totalItems).toBe(5);
    expect(stats.maxModifiers).toBe(2);
  });
});

describe('hashDirectOrderRequest', () => {
  it('returns stable sha256 hex for same payload', async () => {
    const { hashDirectOrderRequest } = await import('../../src/lib/directOrderValidation');
    const payload = { cart: [{ productId: 'p1', quantity: 1 }] };
    const a = await hashDirectOrderRequest(payload);
    const b = await hashDirectOrderRequest(payload);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});
