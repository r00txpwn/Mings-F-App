/**
 * Fail-closed kiosk shared-secret gate. Pure (no Deno) for Vitest.
 */
import { timingSafeEqualString } from './timingSafeEqual.ts';

export type KioskSecretGateOk = { ok: true };
export type KioskSecretGateFail = {
  ok: false;
  status: 403;
  code: 'KIOSK_MISCONFIGURED' | 'KIOSK_FORBIDDEN';
  error: string;
};
export type KioskSecretGateResult = KioskSecretGateOk | KioskSecretGateFail;

export async function assertKioskSecret(params: {
  expected: string | null | undefined;
  provided: string | null | undefined;
}): Promise<KioskSecretGateResult> {
  const expected = (params.expected ?? '').trim();
  if (!expected) {
    return {
      ok: false,
      status: 403,
      code: 'KIOSK_MISCONFIGURED',
      error: 'Kiosk secret is not configured',
    };
  }
  const provided = (params.provided ?? '').trim();
  const matches = await timingSafeEqualString(provided, expected);
  if (!matches) {
    return { ok: false, status: 403, code: 'KIOSK_FORBIDDEN', error: 'Invalid kiosk access' };
  }
  return { ok: true };
}
