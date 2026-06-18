import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  mapProviderStatus as mapProviderStatusPure,
  parseUnitedPaymentReturn as parseUnitedPaymentReturnPure,
  type UnitedPaymentReturnData,
} from './unitedPaymentReturnParse.ts';

export type UnitedPaymentLanguage = 'AZ' | 'EN' | 'RU';

export type UnitedPaymentCheckoutParams = {
  token: string;
  clientOrderId: string;
  amount: number;
  language: UnitedPaymentLanguage;
  successUrl: string;
  cancelUrl: string;
  declineUrl: string;
  webhookUrl?: string;
  description?: string;
  memberId?: string;
  additionalInformation?: string;
  email?: string;
  phoneNumber?: string;
  clientName?: string;
  partnerId?: string;
  applePay?: boolean;
  addCard?: boolean;
  currency?: string;
};

export type UnitedPaymentCheckoutResult = {
  ok: boolean;
  transactionId?: string;
  checkoutUrl?: string;
  raw: unknown;
  message?: string;
};

export type UnitedPaymentStatusResult = {
  ok: boolean;
  status?: string;
  orderStatus?: string;
  bankOrderId?: string;
  bankSessionId?: string;
  raw: unknown;
  message?: string;
};

export type { UnitedPaymentReturnData };

export { parseUnitedPaymentReturnPure as parseUnitedPaymentReturn };

type TokenCache = {
  token: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

function env(key: string): string {
  return (Deno.env.get(key) ?? '').trim();
}

function joinUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function endpoint(name: string, fallbackPath: string): string {
  const explicit = env(`UNITED_PAYMENT_${name}_URL`);
  if (explicit) return explicit;
  const base = env('UNITED_PAYMENT_API_BASE');
  if (!base) return '';
  return joinUrl(base, fallbackPath);
}

function authUrl(): string {
  return endpoint('AUTH', '/auth/');
}

function checkoutUrl(): string {
  return endpoint('CHECKOUT', '/transactions/checkout');
}

function statusByOrderUrl(clientOrderId: string): string {
  const explicit = env('UNITED_PAYMENT_STATUS_BY_ORDER_URL');
  if (explicit) return explicit.replace('{clientOrderId}', encodeURIComponent(clientOrderId));
  const base = env('UNITED_PAYMENT_API_BASE');
  return base ? joinUrl(base, `/transactions/status/order/${encodeURIComponent(clientOrderId)}`) : '';
}

function statusByTransactionUrl(transactionId: string): string {
  const explicit = env('UNITED_PAYMENT_STATUS_BY_TRANSACTION_URL');
  if (explicit) return explicit.replace('{transactionId}', encodeURIComponent(transactionId));
  const base = env('UNITED_PAYMENT_API_BASE');
  return base ? joinUrl(base, `/transactions/status/${encodeURIComponent(transactionId)}`) : '';
}

function asObject(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function firstString(raw: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = raw[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return undefined;
}

function firstId(raw: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = raw[key];
    if (value == null) continue;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (String(value).trim()) return String(value).trim();
  }
  return undefined;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text };
  }
}

export function configuredForCheckout(): { ok: true } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  if (!authUrl()) missing.push('UNITED_PAYMENT_AUTH_URL or UNITED_PAYMENT_API_BASE');
  if (!checkoutUrl()) missing.push('UNITED_PAYMENT_CHECKOUT_URL or UNITED_PAYMENT_API_BASE');
  if (!env('UNITED_PAYMENT_EMAIL') && !env('UNITED_PAYMENT_USERNAME')) {
    missing.push('UNITED_PAYMENT_EMAIL or UNITED_PAYMENT_USERNAME');
  }
  if (!env('UNITED_PAYMENT_PASSWORD')) missing.push('UNITED_PAYMENT_PASSWORD');
  return missing.length ? { ok: false, missing } : { ok: true };
}

export async function getAuthToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.token;
  }

  const url = authUrl();
  if (!url) throw new Error('United Payment auth URL is not configured');

  const username = env('UNITED_PAYMENT_EMAIL') || env('UNITED_PAYMENT_USERNAME');
  const password = env('UNITED_PAYMENT_PASSWORD');
  const body: Record<string, unknown> = {
    password,
  };
  if (env('UNITED_PAYMENT_EMAIL')) body.email = username;
  else body.username = username;
  if (env('UNITED_PAYMENT_MERCHANT_ID')) body.merchantId = env('UNITED_PAYMENT_MERCHANT_ID');
  if (env('UNITED_PAYMENT_USER_CODE')) body.userCode = env('UNITED_PAYMENT_USER_CODE');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const raw = await readJsonResponse(response);
  const obj = asObject(raw);
  let token = firstString(obj, ['token', 'accessToken', 'access_token']);
  if (!response.ok || !token) {
    throw new Error(
      `United Payment auth failed (${response.status}): ${firstString(obj, ['message', 'error']) ?? 'token missing'}`
    );
  }
  token = token.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    throw new Error(`United Payment auth failed (${response.status}): token empty after normalization`);
  }

  tokenCache = {
    token,
    expiresAt: now + 50 * 60_000,
  };
  return token;
}

export async function createCheckout(params: UnitedPaymentCheckoutParams): Promise<UnitedPaymentCheckoutResult> {
  const url = checkoutUrl();
  if (!url) throw new Error('United Payment checkout URL is not configured');

  const currency = params.currency ?? env('UNITED_PAYMENT_CURRENCY') || '944';

  const payload: Record<string, unknown> = {
    clientOrderId: params.clientOrderId,
    amount: params.amount,
    language: params.language,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    declineUrl: params.declineUrl,
    currency,
  };
  for (const key of [
    'webhookUrl',
    'description',
    'memberId',
    'additionalInformation',
    'email',
    'phoneNumber',
    'clientName',
    'partnerId',
  ] as const) {
    const value = params[key];
    if (value != null && String(value).trim()) payload[key] = value;
  }
  if (params.applePay != null) payload.applePay = params.applePay;
  if (params.addCard != null) payload.addCard = params.addCard;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': params.token,
    },
    body: JSON.stringify(payload),
  });
  const raw = await readJsonResponse(response);
  const obj = asObject(raw);
  const data = asObject(obj.data ?? obj.result);
  const source = Object.keys(data).length ? data : obj;
  const transactionId = firstId(source, ['transactionId', 'transaction_id', 'Transaction', 'id']);
  const payUrl = firstString(source, [
    'checkoutUrl',
    'paymentUrl',
    'payment_url',
    'redirectUrl',
    'redirect_url',
    'url',
    'pageUrl',
    'paymentPageUrl',
  ]);

  return {
    ok: response.ok && Boolean(payUrl),
    transactionId,
    checkoutUrl: payUrl,
    raw,
    message: firstString(source, ['message', 'error', 'errorMessage']),
  };
}

export async function statusByClientOrderId(
  token: string,
  clientOrderId: string
): Promise<UnitedPaymentStatusResult> {
  const url = statusByOrderUrl(clientOrderId);
  if (!url) throw new Error('United Payment status-by-order URL is not configured');
  return fetchStatus(token, url, { clientOrderId });
}

export async function statusByTransactionId(
  token: string,
  transactionId: string
): Promise<UnitedPaymentStatusResult> {
  const url = statusByTransactionUrl(transactionId);
  if (!url) throw new Error('United Payment status-by-transaction URL is not configured');
  return fetchStatus(token, url, { transactionId });
}

async function fetchStatus(
  token: string,
  url: string,
  fallbackBody: Record<string, string>
): Promise<UnitedPaymentStatusResult> {
  const method = env('UNITED_PAYMENT_STATUS_METHOD').toUpperCase() || 'GET';
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
  };
  if (method !== 'GET') init.body = JSON.stringify(fallbackBody);
  const response = await fetch(url, init);
  const raw = await readJsonResponse(response);
  const obj = asObject(raw);
  const data = asObject(obj.data ?? obj.result);
  const source = Object.keys(data).length ? data : obj;
  return {
    ok: response.ok,
    status: firstString(source, ['status', 'Status', 'orderStatus', 'OrderStatus']),
    orderStatus: firstString(source, ['orderStatus', 'OrderStatus', 'Status', 'status']),
    bankOrderId: firstString(source, ['bankOrderId', 'BankOrderId', 'BankTransaction']),
    bankSessionId: firstString(source, ['bankSessionId', 'BankSessionId']),
    raw,
    message: firstString(source, ['message', 'error', 'errorMessage']),
  };
}

/** Best-effort provider status string from a status-check API response. */
export function extractConfirmedStatus(result: UnitedPaymentStatusResult): string {
  return result.orderStatus ?? result.status ?? 'PENDING';
}

/**
 * Server-side status re-confirmation (preferred over trusting webhook/redirect payload).
 */
export async function confirmProviderStatus(refs: {
  clientOrderId?: string | null;
  transactionId?: string | null;
}): Promise<{ ok: boolean; status: string; result: UnitedPaymentStatusResult | null; message?: string }> {
  const tx = refs.transactionId?.trim() || null;
  const order = refs.clientOrderId?.trim() || null;
  if (!tx && !order) {
    return { ok: false, status: 'PENDING', result: null, message: 'No provider reference' };
  }

  try {
    const token = await getAuthToken();
    const result = tx
      ? await statusByTransactionId(token, tx)
      : await statusByClientOrderId(token, order!);
    if (!result.ok) {
      return {
        ok: false,
        status: 'PENDING',
        result,
        message: result.message ?? 'Status check failed',
      };
    }
    return { ok: true, status: extractConfirmedStatus(result), result };
  } catch (e) {
    return {
      ok: false,
      status: 'PENDING',
      result: null,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export function mapProviderStatus(rawStatus: string | null | undefined): 'success' | 'failed' | 'pending' {
  return mapProviderStatusPure(rawStatus);
}

export function normalizeAmount(amount: number): number {
  return Number(Number(amount).toFixed(2));
}

/** URL-safe Base64: +→-, /→_, strip trailing = */
function toUrlSafeBase64NoPadding(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeUrlSafeBase64(s: string): Buffer {
  const t = s.trim();
  const pad = (4 - (t.length % 4)) % 4;
  const std = t.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
  return Buffer.from(std, 'base64');
}

/**
 * Optional HMAC verification when UNITED_PAYMENT_WEBHOOK_SECRET is set.
 * United Payment hosted checkout does not send signatures; when no secret is configured we allow
 * the request through and rely on confirmProviderStatus() before mutating payment state.
 */
export function verifyUnitedPaymentWebhookSignature(
  rawBody: Uint8Array,
  xSignatureHeader: string | null | undefined
): boolean {
  const secret = env('UNITED_PAYMENT_WEBHOOK_SECRET') || env('UNITED_PAYMENT_HASH_KEY');
  if (!secret) return true;

  const received = (xSignatureHeader ?? '').trim();
  if (!received) return false;

  const mac = createHmac('sha256', secret).update(Buffer.from(rawBody)).digest();
  const expectedStr = toUrlSafeBase64NoPadding(mac);
  const recvNorm = received.replace(/=+$/g, '');
  const expNorm = expectedStr.replace(/=+$/g, '');

  try {
    const expBuf = decodeUrlSafeBase64(expNorm);
    const recBuf = decodeUrlSafeBase64(recvNorm);
    if (expBuf.length !== recBuf.length) return false;
    return timingSafeEqual(expBuf, recBuf);
  } catch {
    return false;
  }
}
