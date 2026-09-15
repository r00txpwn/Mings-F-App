/**
 * Fail-closed Wolt Drive webhook signature gate. Pure (no Deno) for Vitest.
 * Header is a shared secret (not HMAC of the body).
 */
import { timingSafeEqualString } from './timingSafeEqual.ts';

export type WoltWebhookGateOk = { ok: true };
export type WoltWebhookGateFail = {
  ok: false;
  status: 401 | 403;
  code: 'WOLT_WEBHOOK_MISCONFIGURED' | 'WOLT_WEBHOOK_UNAUTHORIZED';
  error: string;
};
export type WoltWebhookGateResult = WoltWebhookGateOk | WoltWebhookGateFail;

export function readWoltSignatureHeader(headers: {
  get(name: string): string | null;
}): string {
  return (headers.get('X-Wolt-Signature') ?? headers.get('x-wolt-signature') ?? '').trim();
}

export async function assertWoltWebhookSignature(params: {
  expected: string | null | undefined;
  provided: string | null | undefined;
}): Promise<WoltWebhookGateResult> {
  const expected = (params.expected ?? '').trim();
  if (!expected) {
    return {
      ok: false,
      status: 403,
      code: 'WOLT_WEBHOOK_MISCONFIGURED',
      error: 'Wolt webhook secret is not configured',
    };
  }
  const provided = (params.provided ?? '').trim();
  const matches = await timingSafeEqualString(provided, expected);
  if (!matches) {
    return {
      ok: false,
      status: 401,
      code: 'WOLT_WEBHOOK_UNAUTHORIZED',
      error: 'Invalid signature',
    };
  }
  return { ok: true };
}
