/**
 * Pure helpers for United Payment redirect/webhook payloads (base64 `up` param + JSON fallbacks).
 * No Deno/env dependencies — safe to unit-test from Vitest.
 */

export type UnitedPaymentReturnData = {
  clientOrderId: string | null;
  transactionId: string | null;
  status: string | null;
  decoded: Record<string, unknown>;
  source: 'up_param' | 'json' | 'form' | 'query' | 'raw_base64';
};

function asObject(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

function firstString(raw: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = raw[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return null;
}

function firstId(raw: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = raw[key];
    if (value == null) continue;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (String(value).trim()) return String(value).trim();
  }
  return null;
}

function decodeBase64ToJson(b64: string): Record<string, unknown> | null {
  const trimmed = b64.trim();
  if (!trimmed) return null;
  const pad = (4 - (trimmed.length % 4)) % 4;
  const std = trimmed.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  try {
    const json = atob(std);
    return asObject(JSON.parse(json));
  } catch {
    return null;
  }
}

function extractFromDecoded(decoded: Record<string, unknown>, source: UnitedPaymentReturnData['source']): UnitedPaymentReturnData {
  return {
    clientOrderId: firstString(decoded, ['OrderId', 'orderId', 'clientOrderId', 'ClientOrderId']),
    transactionId: firstId(decoded, ['Transaction', 'transaction', 'transactionId', 'TransactionId']),
    status: firstString(decoded, ['Status', 'status']),
    decoded,
    source,
  };
}

function paramsToRecord(params: URLSearchParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

/**
 * Parses United Payment return/webhook input: base64 `up` query/body param, JSON, or form fields.
 */
export function parseUnitedPaymentReturn(
  input: string | URLSearchParams | Record<string, unknown>
): UnitedPaymentReturnData {
  if (input instanceof URLSearchParams) {
    const up = input.get('up');
    if (up) {
      const decoded = decodeBase64ToJson(up);
      if (decoded) return extractFromDecoded(decoded, 'up_param');
    }
    const record = paramsToRecord(input);
    return extractFromDecoded(record, 'query');
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      return { clientOrderId: null, transactionId: null, status: null, decoded: {}, source: 'json' };
    }

    if (trimmed.startsWith('{')) {
      try {
        return extractFromDecoded(JSON.parse(trimmed) as Record<string, unknown>, 'json');
      } catch {
        // fall through
      }
    }

    if (trimmed.includes('=') && !trimmed.startsWith('{')) {
      const params = new URLSearchParams(trimmed);
      const up = params.get('up');
      if (up) {
        const decoded = decodeBase64ToJson(up);
        if (decoded) return extractFromDecoded(decoded, 'form');
      }
      return extractFromDecoded(paramsToRecord(params), 'form');
    }

    const decoded = decodeBase64ToJson(trimmed);
    if (decoded) return extractFromDecoded(decoded, 'raw_base64');

    return { clientOrderId: null, transactionId: null, status: null, decoded: {}, source: 'json' };
  }

  const obj = asObject(input);
  const up = obj.up != null ? String(obj.up) : null;
  if (up) {
    const decoded = decodeBase64ToJson(up);
    if (decoded) return extractFromDecoded({ ...obj, ...decoded }, 'up_param');
  }
  return extractFromDecoded(obj, 'json');
}

export function mapProviderStatus(rawStatus: string | null | undefined): 'success' | 'failed' | 'pending' {
  const s = String(rawStatus ?? '').trim().toUpperCase();
  if (
    s === '00' ||
    s === '001' ||
    s === 'APPROVED' ||
    s === 'SUCCESS' ||
    s === 'SUCCESSFUL' ||
    s === 'COMPLETED' ||
    s === 'FULLYPAID' ||
    s === 'FULLY_PAID'
  ) {
    return 'success';
  }
  if (
    s === 'DECLINED' ||
    s === 'DECLINE' ||
    s === 'CANCELED' ||
    s === 'CANCELLED' ||
    s === 'CANCEL' ||
    s === 'FAILED' ||
    s === 'UNSUCCESS' ||
    s === 'UNSUCCESSFUL' ||
    s === 'REVERSED' ||
    s === 'REJECTED'
  ) {
    return 'failed';
  }
  return 'pending';
}
