import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { requireStaffAuth } from '../_shared/staffAuth.ts';
import { inspectStaffBearer, WOLT_DRIVE_MUTATION_ROLES } from '../_shared/staffBearer.ts';
import {
  createWoltDriveDelivery,
  readWoltPickupFromEnv,
  resolveWoltCreateMode,
  stubDeliveryId,
  WOLT_NOT_CONFIGURED,
} from '../_shared/woltCreatePolicy.ts';

/**
 * Register a delivery with Wolt Drive.
 * Auth: staff JWT via requireStaffAuth; minRole admin|staff (manager excluded
 * to match wolt-drive-manual-dispatch).
 *
 * Live path requires WOLT_API_TOKEN and persists real response ids only
 * (never wolt_stub_*). Stub ids only when WOLT_ALLOW_STUB=true|1 AND the
 * runtime is not production (see woltCreatePolicy.ts).
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const pre = inspectStaffBearer(req.headers.get('Authorization'), Deno.env.get('SUPABASE_ANON_KEY'));
  if (!pre.ok) {
    return jsonResponse({ ok: false, error: { code: pre.code, message: pre.message } }, pre.status);
  }

  const auth = await requireStaffAuth(req, { minRole: [...WOLT_DRIVE_MUTATION_ROLES] });
  if (auth instanceof Response) return auth;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  let body: { saleId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }
  const saleId = body.saleId;
  if (!saleId) return jsonResponse({ error: 'saleId required' }, 400);

  const { data: sale, error: sErr } = await supabase
    .from('sales')
    .select('id, source, delivery_address, customer_phone, customer_name, delivery_lat, delivery_lng, delivery_notes')
    .eq('id', saleId)
    .maybeSingle();

  if (sErr || !sale) return jsonResponse({ error: 'Sale not found' }, 404);
  if (sale.source !== 'online_delivery') {
    return jsonResponse({ error: 'Sale is not a delivery order' }, 400);
  }

  const mode = resolveWoltCreateMode({
    WOLT_API_TOKEN: Deno.env.get('WOLT_API_TOKEN'),
    WOLT_ALLOW_STUB: Deno.env.get('WOLT_ALLOW_STUB'),
    DENO_ENV: Deno.env.get('DENO_ENV'),
    NODE_ENV: Deno.env.get('NODE_ENV'),
    ENVIRONMENT: Deno.env.get('ENVIRONMENT'),
    WOLT_ENV: Deno.env.get('WOLT_ENV'),
  });

  if (mode === 'unavailable') {
    return jsonResponse(
      { error: 'Wolt Drive is not configured', code: WOLT_NOT_CONFIGURED },
      503
    );
  }

  let woltId: string;
  let trackingUrl: string | null = null;
  let rawPayload: Record<string, unknown>;

  if (mode === 'live') {
    const token = (Deno.env.get('WOLT_API_TOKEN') ?? '').trim();
    const created = await createWoltDriveDelivery({
      token,
      sale: {
        id: sale.id as string,
        customer_name: sale.customer_name as string | null,
        customer_phone: sale.customer_phone as string | null,
        delivery_address: sale.delivery_address as string | null,
        delivery_lat: sale.delivery_lat as number | null,
        delivery_lng: sale.delivery_lng as number | null,
        delivery_notes: sale.delivery_notes as string | null,
      },
      pickup: readWoltPickupFromEnv({
        WOLT_PICKUP_NAME: Deno.env.get('WOLT_PICKUP_NAME'),
        WOLT_PICKUP_PHONE: Deno.env.get('WOLT_PICKUP_PHONE'),
        WOLT_PICKUP_ADDRESS: Deno.env.get('WOLT_PICKUP_ADDRESS'),
        WOLT_PICKUP_LAT: Deno.env.get('WOLT_PICKUP_LAT'),
        WOLT_PICKUP_LNG: Deno.env.get('WOLT_PICKUP_LNG'),
      }),
      apiBase: Deno.env.get('WOLT_API_BASE') ?? undefined,
    });
    if (!created.ok) {
      return jsonResponse({ error: created.error, code: created.code }, created.status);
    }
    woltId = created.woltDeliveryId;
    trackingUrl = created.trackingUrl;
    rawPayload = created.raw && typeof created.raw === 'object' ? (created.raw as Record<string, unknown>) : { wolt: created.raw };
  } else {
    woltId = stubDeliveryId(saleId);
    rawPayload = { note: 'Non-prod stub. Set WOLT_API_TOKEN for live Wolt Drive.' };
  }

  const { data: row, error } = await supabase
    .from('delivery_orders')
    .upsert(
      {
        sale_id: saleId,
        wolt_delivery_id: woltId,
        status: 'created',
        tracking_url: trackingUrl,
        raw_payload: rawPayload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'sale_id' }
    )
    .select('id')
    .single();

  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({
    deliveryOrderId: row?.id,
    woltDeliveryId: woltId,
    stub: mode === 'stub',
  });
});
