import { describe, expect, it } from 'vitest';
import { assertKioskSecret } from '../../supabase/functions/_shared/kioskSecret.ts';
import {
  assertWoltWebhookSignature,
  readWoltSignatureHeader,
} from '../../supabase/functions/_shared/woltWebhookAuth.ts';
import {
  inspectStaffBearer,
  staffRoleAllowed,
  WOLT_DRIVE_MUTATION_ROLES,
} from '../../supabase/functions/_shared/staffBearer.ts';
import {
  createWoltDriveDelivery,
  isProductionRuntime,
  isStubDeliveryId,
  parseWoltCreateResponse,
  resolveWoltCreateMode,
  stubDeliveryId,
  WOLT_NOT_CONFIGURED,
  WOLT_STUB_PREFIX,
} from '../../supabase/functions/_shared/woltCreatePolicy.ts';

const ANON = 'sb-anon-placeholder-key';
const STAFF_JWT = 'staff-session-jwt';

describe('kiosk secret gate', () => {
  it('unset secret → misconfigured', async () => {
    const r = await assertKioskSecret({ expected: '', provided: 'anything' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(403);
      expect(r.code).toBe('KIOSK_MISCONFIGURED');
    }
  });

  it('whitespace-only secret → misconfigured', async () => {
    const r = await assertKioskSecret({ expected: '   ', provided: '   ' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('KIOSK_MISCONFIGURED');
  });

  it('wrong header → forbidden', async () => {
    const r = await assertKioskSecret({ expected: 'kiosk-secret', provided: 'nope' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(403);
      expect(r.code).toBe('KIOSK_FORBIDDEN');
    }
  });

  it('missing header → forbidden', async () => {
    const r = await assertKioskSecret({ expected: 'kiosk-secret', provided: null });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('KIOSK_FORBIDDEN');
  });

  it('matching header passes the gate', async () => {
    const r = await assertKioskSecret({ expected: 'kiosk-secret', provided: 'kiosk-secret' });
    expect(r).toEqual({ ok: true });
  });
});

describe('wolt webhook signature', () => {
  it('unset secret → 403', async () => {
    const r = await assertWoltWebhookSignature({ expected: '', provided: 'sig' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(403);
      expect(r.code).toBe('WOLT_WEBHOOK_MISCONFIGURED');
    }
  });

  it('wrong signature → 401', async () => {
    const r = await assertWoltWebhookSignature({ expected: 'wolt-secret', provided: 'wrong' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(401);
      expect(r.code).toBe('WOLT_WEBHOOK_UNAUTHORIZED');
    }
  });

  it('missing signature → 401', async () => {
    const r = await assertWoltWebhookSignature({ expected: 'wolt-secret', provided: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });

  it('matching signature continues', async () => {
    const r = await assertWoltWebhookSignature({ expected: 'wolt-secret', provided: 'wolt-secret' });
    expect(r).toEqual({ ok: true });
  });

  it('reads X-Wolt-Signature or x-wolt-signature', () => {
    const mixed = new Headers({ 'X-Wolt-Signature': 'abc' });
    expect(readWoltSignatureHeader(mixed)).toBe('abc');
    const lower = new Headers({ 'x-wolt-signature': 'xyz' });
    expect(readWoltSignatureHeader(lower)).toBe('xyz');
  });
});

describe('wolt cancel/create staff bearer', () => {
  it('no Auth → 401', () => {
    const r = inspectStaffBearer(null, ANON);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(401);
      expect(r.code).toBe('UNAUTHORIZED');
    }
  });

  it('anon key as Bearer → 401', () => {
    const r = inspectStaffBearer(`Bearer ${ANON}`, ANON);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(401);
      expect(r.code).toBe('UNAUTHORIZED');
    }
  });

  it('staff JWT passes bearer pre-check', () => {
    const r = inspectStaffBearer(`Bearer ${STAFF_JWT}`, ANON);
    expect(r).toEqual({ ok: true, token: STAFF_JWT });
  });

  it('admin and staff roles allowed; manager excluded', () => {
    expect(staffRoleAllowed('admin', WOLT_DRIVE_MUTATION_ROLES)).toBe(true);
    expect(staffRoleAllowed('staff', WOLT_DRIVE_MUTATION_ROLES)).toBe(true);
    expect(staffRoleAllowed('manager', WOLT_DRIVE_MUTATION_ROLES)).toBe(false);
  });
});

describe('wolt create policy', () => {
  it('no token + no stub → unavailable (503 path)', () => {
    expect(resolveWoltCreateMode({})).toBe('unavailable');
    expect(resolveWoltCreateMode({ WOLT_ALLOW_STUB: 'false', NODE_ENV: 'development' })).toBe(
      'unavailable'
    );
  });

  it('stub only with flag + non-prod', () => {
    expect(
      resolveWoltCreateMode({ WOLT_ALLOW_STUB: 'true', NODE_ENV: 'development' })
    ).toBe('stub');
    expect(resolveWoltCreateMode({ WOLT_ALLOW_STUB: '1', DENO_ENV: 'test' })).toBe('stub');
  });

  it('stub flag ignored in production', () => {
    expect(
      resolveWoltCreateMode({ WOLT_ALLOW_STUB: 'true', NODE_ENV: 'production' })
    ).toBe('unavailable');
    expect(isProductionRuntime({ WOLT_ENV: 'prod' })).toBe(true);
    expect(isProductionRuntime({})).toBe(true);
  });

  it('token path is live even if stub flag set', () => {
    expect(
      resolveWoltCreateMode({
        WOLT_API_TOKEN: 'token',
        WOLT_ALLOW_STUB: 'true',
        NODE_ENV: 'development',
      })
    ).toBe('live');
  });

  it('token path never uses wolt_stub_ prefix (mock HTTP)', async () => {
    const created = await createWoltDriveDelivery({
      token: 'wolt-token',
      sale: {
        id: 'sale-1',
        customer_name: 'Ada',
        customer_phone: '+994500000000',
        delivery_address: 'Baku',
        delivery_lat: 40.4,
        delivery_lng: 49.8,
      },
      pickup: { name: "Ming's", phone: '+994500000001', address: 'Nizami' },
      fetchImpl: async () =>
        new Response(JSON.stringify({ id: 'wolt-real-99', tracking: { url: 'https://wolt.example/t' } }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
    });
    expect(created.ok).toBe(true);
    if (created.ok) {
      expect(created.woltDeliveryId).toBe('wolt-real-99');
      expect(created.woltDeliveryId.startsWith(WOLT_STUB_PREFIX)).toBe(false);
      expect(isStubDeliveryId(created.woltDeliveryId)).toBe(false);
      expect(created.trackingUrl).toBe('https://wolt.example/t');
    }
  });

  it('rejects stub-shaped ids from the live API', () => {
    expect(parseWoltCreateResponse({ id: stubDeliveryId('sale-1') })).toBeNull();
    expect(parseWoltCreateResponse({ id: 'wolt-real' })?.woltDeliveryId).toBe('wolt-real');
  });

  it('empty token on live helper → not configured', async () => {
    const created = await createWoltDriveDelivery({
      token: '  ',
      sale: { id: 'sale-1' },
      pickup: { name: "Ming's", phone: '', address: '' },
      fetchImpl: async () => {
        throw new Error('must not fetch');
      },
    });
    expect(created.ok).toBe(false);
    if (!created.ok) {
      expect(created.status).toBe(503);
      expect(created.code).toBe(WOLT_NOT_CONFIGURED);
    }
  });
});
