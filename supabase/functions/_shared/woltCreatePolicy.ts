/**
 * Wolt Drive create: live API vs non-prod stub vs unavailable.
 * Pure policy + mockable fetch — Vitest-safe (no Deno).
 *
 * Production detection (fail-closed): any of DENO_ENV / NODE_ENV / ENVIRONMENT /
 * WOLT_ENV equal to "production" or "prod" → production. Explicit non-prod
 * values (development, dev, test, local, staging, sandbox) allow stubs when
 * WOLT_ALLOW_STUB is true/1. Unset env is treated as production so stubs
 * never mint by default.
 */

export const WOLT_STUB_PREFIX = 'wolt_stub_';
export const WOLT_NOT_CONFIGURED = 'WOLT_NOT_CONFIGURED';
export const DEFAULT_WOLT_API_BASE = 'https://daas-api.wolt.com';

export type WoltCreateEnv = {
  WOLT_API_TOKEN?: string | null;
  WOLT_ALLOW_STUB?: string | null;
  DENO_ENV?: string | null;
  NODE_ENV?: string | null;
  ENVIRONMENT?: string | null;
  WOLT_ENV?: string | null;
};

export type WoltCreateMode = 'live' | 'stub' | 'unavailable';

const PROD_VALUES = new Set(['production', 'prod']);
const NON_PROD_VALUES = new Set(['development', 'dev', 'test', 'local', 'staging', 'sandbox']);

export function isProductionRuntime(env: WoltCreateEnv): boolean {
  const raw = [env.DENO_ENV, env.NODE_ENV, env.ENVIRONMENT, env.WOLT_ENV]
    .map((v) => (v ?? '').trim().toLowerCase())
    .filter(Boolean);
  if (raw.some((v) => PROD_VALUES.has(v))) return true;
  if (raw.some((v) => NON_PROD_VALUES.has(v))) return false;
  return true;
}

export function woltAllowStubFlag(raw: string | null | undefined): boolean {
  const v = (raw ?? '').trim().toLowerCase();
  return v === 'true' || v === '1';
}

export function resolveWoltCreateMode(env: WoltCreateEnv): WoltCreateMode {
  if ((env.WOLT_API_TOKEN ?? '').trim()) return 'live';
  if (woltAllowStubFlag(env.WOLT_ALLOW_STUB) && !isProductionRuntime(env)) return 'stub';
  return 'unavailable';
}

export function stubDeliveryId(saleId: string): string {
  return `${WOLT_STUB_PREFIX}${saleId}`;
}

export function isStubDeliveryId(id: string): boolean {
  return id.startsWith(WOLT_STUB_PREFIX);
}

export type WoltPickup = {
  name: string;
  phone: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
};

export type WoltDropoffSale = {
  id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  delivery_notes?: string | null;
};

function asRecord(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
}

function firstString(raw: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = raw[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return null;
}

export function parseWoltCreateResponse(
  payload: unknown
): { woltDeliveryId: string; trackingUrl: string | null } | null {
  const obj = asRecord(payload);
  if (!obj) return null;
  const tracking = asRecord(obj.tracking);
  const woltDeliveryId =
    firstString(obj, ['id', 'delivery_id', 'wolt_delivery_id']) ??
    (tracking ? firstString(tracking, ['id', 'delivery_id']) : null);
  if (!woltDeliveryId || isStubDeliveryId(woltDeliveryId)) return null;
  const trackingUrl =
    firstString(obj, ['tracking_url', 'trackingUrl']) ??
    (tracking ? firstString(tracking, ['url', 'tracking_url', 'trackingUrl']) : null);
  return { woltDeliveryId, trackingUrl };
}

export function buildWoltCreateBody(sale: WoltDropoffSale, pickup: WoltPickup): Record<string, unknown> {
  const pickupCoords =
    pickup.lat != null && pickup.lng != null && Number.isFinite(pickup.lat) && Number.isFinite(pickup.lng)
      ? { coordinates: { lat: pickup.lat, lon: pickup.lng } }
      : {};
  const dropLat = sale.delivery_lat;
  const dropLng = sale.delivery_lng;
  const dropoffCoords =
    dropLat != null && dropLng != null && Number.isFinite(dropLat) && Number.isFinite(dropLng)
      ? { coordinates: { lat: dropLat, lon: dropLng } }
      : {};
  return {
    merchant_order_reference_id: sale.id,
    pickup: {
      location: { formatted_address: pickup.address, ...pickupCoords },
      comment: '',
      contact_details: {
        name: pickup.name,
        phone_number: pickup.phone,
        send_tracking_link_sms: false,
      },
    },
    dropoff: {
      location: { formatted_address: sale.delivery_address ?? '', ...dropoffCoords },
      comment: sale.delivery_notes ?? '',
      contact_details: {
        name: sale.customer_name || 'Customer',
        phone_number: sale.customer_phone ?? '',
        send_tracking_link_sms: false,
      },
    },
    parcels: [{ dimensions: { weight_gram: 2000 } }],
  };
}

export type WoltLiveCreateOk = {
  ok: true;
  woltDeliveryId: string;
  trackingUrl: string | null;
  raw: unknown;
};
export type WoltLiveCreateFail = { ok: false; status: number; error: string; code: string };
export type WoltLiveCreateResult = WoltLiveCreateOk | WoltLiveCreateFail;

export async function createWoltDriveDelivery(opts: {
  token: string;
  sale: WoltDropoffSale;
  pickup: WoltPickup;
  apiBase?: string;
  fetchImpl?: typeof fetch;
}): Promise<WoltLiveCreateResult> {
  const token = opts.token.trim();
  if (!token) {
    return { ok: false, status: 503, error: 'Wolt API token is not configured', code: WOLT_NOT_CONFIGURED };
  }
  const apiBase = (opts.apiBase ?? DEFAULT_WOLT_API_BASE).replace(/\/+$/, '');
  const fetchImpl = opts.fetchImpl ?? fetch;
  let resp: Response;
  try {
    resp = await fetchImpl(`${apiBase}/v1/deliveries`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(buildWoltCreateBody(opts.sale, opts.pickup)),
    });
  } catch (err) {
    return {
      ok: false,
      status: 502,
      error: err instanceof Error ? err.message : 'Wolt API network failure',
      code: 'WOLT_API_UNREACHABLE',
    };
  }

  const rawText = await resp.text();
  let payload: unknown = null;
  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = { raw: rawText };
  }

  if (!resp.ok) {
    return {
      ok: false,
      status: 502,
      error: `Wolt API returned ${resp.status}`,
      code: 'WOLT_API_ERROR',
    };
  }

  const parsed = parseWoltCreateResponse(payload);
  if (!parsed) {
    return {
      ok: false,
      status: 502,
      error: 'Wolt API response missing delivery id',
      code: 'WOLT_API_INVALID_RESPONSE',
    };
  }

  return {
    ok: true,
    woltDeliveryId: parsed.woltDeliveryId,
    trackingUrl: parsed.trackingUrl,
    raw: payload,
  };
}

export function readWoltPickupFromEnv(env: {
  WOLT_PICKUP_NAME?: string | null;
  WOLT_PICKUP_PHONE?: string | null;
  WOLT_PICKUP_ADDRESS?: string | null;
  WOLT_PICKUP_LAT?: string | null;
  WOLT_PICKUP_LNG?: string | null;
}): WoltPickup {
  const latRaw = (env.WOLT_PICKUP_LAT ?? '').trim();
  const lngRaw = (env.WOLT_PICKUP_LNG ?? '').trim();
  const lat = latRaw ? Number(latRaw) : null;
  const lng = lngRaw ? Number(lngRaw) : null;
  return {
    name: (env.WOLT_PICKUP_NAME ?? '').trim() || "Ming's",
    phone: (env.WOLT_PICKUP_PHONE ?? '').trim(),
    address: (env.WOLT_PICKUP_ADDRESS ?? '').trim(),
    lat: lat != null && Number.isFinite(lat) ? lat : null,
    lng: lng != null && Number.isFinite(lng) ? lng : null,
  };
}
