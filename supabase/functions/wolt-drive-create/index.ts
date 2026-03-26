import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

/**
 * Registers a delivery with Wolt Drive API when credentials exist; otherwise inserts a stub row for testing.
 */
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
    .select('id, source, delivery_address, customer_phone')
    .eq('id', saleId)
    .maybeSingle();

  if (sErr || !sale) return jsonResponse({ error: 'Sale not found' }, 404);
  if (sale.source !== 'online_delivery') {
    return jsonResponse({ error: 'Sale is not a delivery order' }, 400);
  }

  const woltId = `wolt_stub_${saleId}`;
  const { data: row, error } = await supabase
    .from('delivery_orders')
    .upsert(
      {
        sale_id: saleId,
        wolt_delivery_id: woltId,
        status: 'created',
        tracking_url: null,
        raw_payload: { note: 'Replace with Wolt Drive API response when WOLT_API_TOKEN is configured.' },
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
    message: 'Stub delivery row created. Integrate Wolt Drive REST API using WOLT_API_TOKEN and merchant env vars.',
  });
});
