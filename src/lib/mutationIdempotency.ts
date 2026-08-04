/** Tables where a retried insert can create real money double-counts. */
export const ADMIN_MONEY_INSERT_TABLES = new Set([
  'supplier_account_payments',
  'liability_payments',
  'bank_withdrawals',
  'cash_movements',
  'account_transfers',
  'salary_payments',
]);

/** Deterministic JSON for fingerprinting pay attempts (key order independent). */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

/**
 * Holds one UUID per distinct mutation intent.
 * Same payload / form snapshot → same key (safe after Failed to fetch).
 * Different payload → new key (real second payment).
 */
export function createIdempotencySession() {
  let key: string | null = null;
  let fingerprint: string | null = null;

  return {
    keyFor(intent: unknown): string {
      const fp = stableStringify(intent);
      if (!key || fingerprint !== fp) {
        key = crypto.randomUUID();
        fingerprint = fp;
      }
      return key;
    },
    clear() {
      key = null;
      fingerprint = null;
    },
  };
}

export type IdempotencySession = ReturnType<typeof createIdempotencySession>;
