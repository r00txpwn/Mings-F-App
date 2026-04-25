/**
 * Epoint.az merchant API client (Deno / Supabase Edge).
 * Signing: base64(sha1(private_key + data + private_key)) per Epoint docs.
 */
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';

const DEFAULT_BASE = 'https://epoint.az/api/1';

export function createSignature(privateKey: string, data: string): string {
  const signatureString = privateKey + data + privateKey;
  const hash = createHash('sha1').update(signatureString).digest();
  return Buffer.from(hash).toString('base64');
}

export function encodeData(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64');
}

export function decodeData<T = Record<string, unknown>>(data: string): T {
  const decoded = Buffer.from(data, 'base64').toString('utf-8');
  return JSON.parse(decoded) as T;
}

export function verifySignature(privateKey: string, data: string, signature: string): boolean {
  if (!privateKey || !data || !signature) return false;
  const expected = createSignature(privateKey, data);
  return expected === signature;
}

function getEnv(key: string): string {
  return (Deno.env.get(key) ?? '').trim();
}

function baseUrl(): string {
  return getEnv('EPOINT_API_BASE') || DEFAULT_BASE;
}

export type EpointPaymentLanguage = 'az' | 'en' | 'ru';

export async function createPayment(params: {
  publicKey: string;
  privateKey: string;
  orderId: string;
  amount: number;
  description: string;
  language?: EpointPaymentLanguage;
  successUrl?: string;
  errorUrl?: string;
}): Promise<{ status: string; transaction?: string; redirectUrl?: string; message?: string; raw: unknown }> {
  const payload: Record<string, unknown> = {
    public_key: params.publicKey,
    amount: params.amount,
    currency: 'AZN',
    language: params.language || 'en',
    order_id: params.orderId,
    description: params.description,
    success_redirect_url: params.successUrl || getEnv('EPOINT_SUCCESS_URL'),
    error_redirect_url: params.errorUrl || getEnv('EPOINT_ERROR_URL'),
  };

  const data = encodeData(payload);
  const signature = createSignature(params.privateKey, data);

  const response = await fetch(`${baseUrl()}/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data, signature }),
  });

  const raw = await response.json().catch(() => ({}));
  const r = raw as Record<string, unknown>;
  return {
    status: String(r.status ?? ''),
    transaction: r.transaction != null ? String(r.transaction) : undefined,
    redirectUrl: r.redirect_url != null ? String(r.redirect_url) : undefined,
    message: r.message != null ? String(r.message) : undefined,
    raw,
  };
}

export async function checkPaymentStatus(params: {
  publicKey: string;
  privateKey: string;
  orderId?: string;
  transaction?: string;
}): Promise<unknown> {
  const r = await checkPaymentStatusDetailed(params);
  if (r.ok) return r.body;
  return {};
}

/** Same as `checkPaymentStatus` but surfaces HTTP / JSON failures for payment-reconcile (never silent). */
export type EpointGetStatusResult =
  | { ok: true; body: Record<string, unknown>; httpStatus: number }
  | { ok: false; kind: 'http' | 'parse'; httpStatus?: number; message: string };

export async function checkPaymentStatusDetailed(params: {
  publicKey: string;
  privateKey: string;
  orderId?: string;
  transaction?: string;
}): Promise<EpointGetStatusResult> {
  const payload: Record<string, unknown> = {
    public_key: params.publicKey,
  };
  if (params.transaction) payload.transaction = params.transaction;
  else if (params.orderId) payload.order_id = params.orderId;

  const data = encodeData(payload);
  const signature = createSignature(params.privateKey, data);

  const response = await fetch(`${baseUrl()}/get-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data, signature }),
  });

  if (!response.ok) {
    return {
      ok: false,
      kind: 'http',
      httpStatus: response.status,
      message: `EPoint get-status HTTP ${response.status}`,
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, kind: 'parse', message: 'EPoint get-status response was not JSON' };
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, kind: 'parse', message: 'EPoint get-status JSON was not an object' };
  }

  return { ok: true, body: body as Record<string, unknown>, httpStatus: response.status };
}

export async function refund(params: {
  publicKey: string;
  privateKey: string;
  cardId: string;
  orderId: string;
  amount: number;
  description?: string;
}): Promise<unknown> {
  const payload = {
    public_key: params.publicKey,
    language: 'en',
    card_id: params.cardId,
    order_id: params.orderId,
    amount: params.amount,
    currency: 'AZN',
    description: params.description || 'Refund',
  };

  const data = encodeData(payload);
  const signature = createSignature(params.privateKey, data);

  const response = await fetch(`${baseUrl()}/refund-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data, signature }),
  });
  return response.json().catch(() => ({}));
}

export async function reverseTransaction(params: {
  publicKey: string;
  privateKey: string;
  transaction: string;
  amount?: number;
}): Promise<unknown> {
  const payload: Record<string, unknown> = {
    public_key: params.publicKey,
    language: 'en',
    transaction: params.transaction,
    currency: 'AZN',
  };
  if (params.amount != null) payload.amount = params.amount;

  const data = encodeData(payload);
  const signature = createSignature(params.privateKey, data);

  const response = await fetch(`${baseUrl()}/reverse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data, signature }),
  });
  return response.json().catch(() => ({}));
}

export async function registerCard(params: {
  publicKey: string;
  privateKey: string;
  description?: string;
  isRefundCard?: boolean;
  successUrl?: string;
  errorUrl?: string;
}): Promise<{ status: string; cardId?: string; redirectUrl?: string; raw: unknown }> {
  const payload: Record<string, unknown> = {
    public_key: params.publicKey,
    language: 'en',
    refund: params.isRefundCard ? 1 : 0,
    description: params.description || 'Save card for future payments',
    success_redirect_url: params.successUrl || getEnv('EPOINT_SUCCESS_URL'),
    error_redirect_url: params.errorUrl || getEnv('EPOINT_ERROR_URL'),
  };

  const data = encodeData(payload);
  const signature = createSignature(params.privateKey, data);

  const response = await fetch(`${baseUrl()}/card-registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data, signature }),
  });

  const raw = await response.json().catch(() => ({}));
  const r = raw as Record<string, unknown>;
  return {
    status: String(r.status ?? ''),
    cardId: r.card_id != null ? String(r.card_id) : undefined,
    redirectUrl: r.redirect_url != null ? String(r.redirect_url) : undefined,
    raw,
  };
}

export async function chargeWithSavedCard(params: {
  publicKey: string;
  privateKey: string;
  cardId: string;
  orderId: string;
  amount: number;
  description?: string;
}): Promise<unknown> {
  const payload = {
    public_key: params.publicKey,
    language: 'en',
    card_id: params.cardId,
    order_id: params.orderId,
    amount: params.amount,
    currency: 'AZN',
    description: params.description || 'Payment',
  };

  const data = encodeData(payload);
  const signature = createSignature(params.privateKey, data);

  const response = await fetch(`${baseUrl()}/execute-pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data, signature }),
  });
  return response.json().catch(() => ({}));
}

export async function registerCardWithPayment(params: {
  publicKey: string;
  privateKey: string;
  orderId: string;
  amount: number;
  description?: string;
  successUrl?: string;
  errorUrl?: string;
}): Promise<{
  status: string;
  cardId?: string;
  transaction?: string;
  redirectUrl?: string;
  raw: unknown;
}> {
  const payload: Record<string, unknown> = {
    public_key: params.publicKey,
    language: 'en',
    order_id: params.orderId,
    amount: params.amount,
    currency: 'AZN',
    description: params.description || 'Payment',
    success_redirect_url: params.successUrl || getEnv('EPOINT_SUCCESS_URL'),
    error_redirect_url: params.errorUrl || getEnv('EPOINT_ERROR_URL'),
  };

  const data = encodeData(payload);
  const signature = createSignature(params.privateKey, data);

  const response = await fetch(`${baseUrl()}/card-registration-with-pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data, signature }),
  });

  const raw = await response.json().catch(() => ({}));
  const r = raw as Record<string, unknown>;
  return {
    status: String(r.status ?? ''),
    cardId: r.card_id != null ? String(r.card_id) : undefined,
    transaction: r.transaction != null ? String(r.transaction) : undefined,
    redirectUrl: r.redirect_url != null ? String(r.redirect_url) : undefined,
    raw,
  };
}

export async function createWalletWidget(params: {
  publicKey: string;
  privateKey: string;
  orderId: string;
  amount: number;
  description: string;
}): Promise<{ status: string; widgetUrl?: string; raw: unknown }> {
  const payload = {
    public_key: params.publicKey,
    amount: params.amount,
    order_id: params.orderId,
    description: params.description,
  };

  const data = encodeData(payload);
  const signature = createSignature(params.privateKey, data);

  const response = await fetch(`${baseUrl()}/token/widget`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data, signature }),
  });

  const raw = await response.json().catch(() => ({}));
  const r = raw as Record<string, unknown>;
  return {
    status: String(r.status ?? ''),
    widgetUrl: r.widget_url != null ? String(r.widget_url) : undefined,
    raw,
  };
}

export async function getAvailableWallets(publicKey: string): Promise<unknown> {
  const response = await fetch(`${baseUrl()}/wallet/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ public_key: publicKey }),
  });
  return response.json().catch(() => ({}));
}

export async function payWithWallet(params: {
  publicKey: string;
  privateKey: string;
  walletId: string;
  orderId: string;
  amount: number;
  description?: string;
  language?: EpointPaymentLanguage;
}): Promise<unknown> {
  const payload = {
    public_key: params.publicKey,
    wallet_id: params.walletId,
    amount: params.amount,
    currency: 'AZN',
    order_id: params.orderId,
    description: params.description || 'Payment',
    language: params.language || 'en',
  };

  const data = encodeData(payload);
  const signature = createSignature(params.privateKey, data);

  const response = await fetch(`${baseUrl()}/wallet/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data, signature }),
  });
  return response.json().catch(() => ({}));
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch('https://epoint.az/api/heartbeat');
    const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return result.status === 'ok';
  } catch {
    return false;
  }
}

/** Parse Epoint server callback: form body or JSON with data + signature fields. */
export function parseEpointCallbackBody(
  rawBody: string,
  contentType: string | null
): { data: string; signature: string } | null {
  const ct = (contentType ?? '').toLowerCase();
  if (ct.includes('application/json')) {
    try {
      const j = JSON.parse(rawBody) as Record<string, unknown>;
      const data = j.data != null ? String(j.data) : '';
      const signature = j.signature != null ? String(j.signature) : '';
      if (data && signature) return { data, signature };
    } catch {
      /* fall through */
    }
  }
  try {
    const params = new URLSearchParams(rawBody.trim());
    const data = params.get('data') ?? '';
    const signature = params.get('signature') ?? '';
    if (data && signature) return { data, signature };
  } catch {
    return null;
  }
  return null;
}
