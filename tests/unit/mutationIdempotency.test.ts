import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ADMIN_MONEY_INSERT_TABLES,
  createIdempotencySession,
  stableStringify,
} from '../../src/lib/mutationIdempotency';

describe('mutationIdempotency', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stableStringify is key-order independent', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
  });

  it('reuses one key for the same intent and issues a new key after form change', () => {
    let n = 0;
    vi.stubGlobal('crypto', {
      randomUUID: () => `00000000-0000-4000-8000-00000000000${n++}`,
    });
    const session = createIdempotencySession();
    const a = session.keyFor({ amount: 858.5, supplier_id: 's1' });
    const b = session.keyFor({ amount: 858.5, supplier_id: 's1' });
    const c = session.keyFor({ amount: 100, supplier_id: 's1' });
    expect(a).toBe(b);
    expect(c).not.toBe(a);
    session.clear();
    const d = session.keyFor({ amount: 858.5, supplier_id: 's1' });
    expect(d).not.toBe(a);
  });

  it('lists money tables that require keys', () => {
    expect(ADMIN_MONEY_INSERT_TABLES.has('supplier_account_payments')).toBe(true);
    expect(ADMIN_MONEY_INSERT_TABLES.has('suppliers')).toBe(false);
  });
});
