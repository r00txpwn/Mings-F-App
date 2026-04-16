import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

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
    .select('id, source, delivery_address, delivery_lat, delivery_lng, customer_name, customer_phone, display_number')
    .eq('id', saleId)
    .maybeSingle();

  if (sErr || !sale) return jsonResponse({ error: 'Sale not found' }, 404);
  if (sale.source !== 'online_delivery') {
    return jsonResponse({ error: 'Sale is not a delivery order' }, 400);
  }
  if (!sale.delivery_lat || !sale.delivery_lng) {
    return jsonResponse({ error: 'Delivery coordinates missing' }, 400);
  }

  // Prevent duplicate dispatches
  const { data: existing } = await supabase
    .from('delivery_orders')
    .select('id, wolt_delivery_id')
    .eq('sale_id', saleId)
    .maybeSingle();

  if (existing?.wolt_delivery_id && !String(existing.wolt_delivery_id).startsWith('wolt_stub_')) {
    return jsonResponse({
      deliveryOrderId: existing.id,
      woltDeliveryId: existing.wolt_delivery_id,
      message: 'Already dispatched',
    });
  }

  const apiToken = Deno.env.get('WOLT_API_TOKEN') ?? '';
  const merchantId = Deno.env.get('WOLT_MERCHANT_ID') ?? '';

  // Stub mode when credentials not configured
  if (!apiToken || !merchantId) {
    const stubId = `wolt_stub_${saleId}`;
    const { data: row, error } = await supabase
      .from('delivery_orders')
      .upsert(
        {
          sale_id: saleId,
          wolt_delivery_id: stubId,
          status: 'created',
          tracking_url: null,
          raw_payload: { note: 'Stub: set WOLT_API_TOKEN and WOLT_MERCHANT_ID to enable real Wolt Drive.' },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'sale_id' }
      )
      .select('id')
      .single();

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({
      deliveryOrderId: row?.id,
      woltDeliveryId: stubId,
      message: 'Stub delivery row created. Configure WOLT_API_TOKEN and WOLT_MERCHANT_ID for live dispatch.',
    });
  }

  // Real Wolt Drive API call (venueless endpoint)
  const woltApiBase = Deno.env.get('WOLT_API_BASE') ?? 'https://restaurant-api.wolt.com';

  const woltPayload = {
    pickup: {
      address: { street_address: Deno.env.get('WOLT_PICKUP_ADDRESS') ?? '' },
      location: {
        lat: parseFloat(Deno.env.get('WOLT_PICKUP_LAT') ?? '0'),
        lon: parseFloat(Deno.env.get('WOLT_PICKUP_LNG') ?? '0'),
      },
      comment: `Order #${sale.display_number ?? saleId}`,
    },
    dropoff: {
      address: { street_address: sale.delivery_address ?? '' },
      location: {
        lat: parseFloat(String(sale.delivery_lat)),
        lon: parseFloat(String(sale.delivery_lng)),
      },
    },
    recipient: {
      name: sale.customer_name ?? 'Customer',
      phone: sale.customer_phone ?? '',
    },
    customer_support: {
      phone: Deno.env.get('WOLT_SUPPORT_PHONE') ?? '',
    },
  };

  let woltResponseJson: Record<string, unknown>;
  try {
    const woltRes = await fetch(`${woltApiBase}/merchants/${merchantId}/delivery-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify(woltPayload),
    });

    woltResponseJson = await woltRes.json() as Record<string, unknown>;

    if (!woltRes.ok) {
      console.error('Wolt Drive API error:', JSON.stringify(woltResponseJson));
      return jsonResponse({ error: 'Wolt Drive API error', detail: woltResponseJson }, 502);
    }
  } catch (err) {
    console.error('Wolt Drive fetch error:', err);
    return jsonResponse({ error: 'Failed to reach Wolt Drive API' }, 502);
  }

  const woltDeliveryId = woltResponseJson.id as string;
  const trackingObj = woltResponseJson.tracking as Record<string, unknown> | undefined;
  const trackingUrl = (trackingObj?.url ?? woltResponseJson.tracking_url) as string | undefined;

  const { data: row, error: upsertErr } = await supabase
    .from('delivery_orders')
    .upsert(
      {
        sale_id: saleId,
        wolt_delivery_id: woltDeliveryId,
        status: 'created',
        tracking_url: trackingUrl ?? null,
        raw_payload: woltResponseJson,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'sale_id' }
    )
    .select('id')
    .single();

  if (upsertErr) return jsonResponse({ error: upsertErr.message }, 500);

  return jsonResponse({
    deliveryOrderId: row?.id,
    woltDeliveryId,
    trackingUrl: trackingUrl ?? null,
  });
});
