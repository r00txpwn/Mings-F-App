import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

// Maps Wolt Drive delivery status values to internal status labels
const WOLT_STATUS_MAP: Record<string, string> = {
  created: 'created',
  accepted: 'accepted',
  pickup: 'preparing',          // courier heading to restaurant
  picked_up: 'picked_up',       // courier collected the order
  dropoff: 'out_for_delivery',  // courier heading to customer
  delivered: 'delivered',
  rejected: 'failed',
  cancelled: 'cancelled',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // Wolt authenticates via Bearer token in Authorization header
  const woltSecret = Deno.env.get('WOLT_WEBHOOK_SECRET') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';
  if (woltSecret && authHeader !== `Bearer ${woltSecret}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json() as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  // Wolt payload: { id, status, tracking: { url }, ... }
  const woltDeliveryId = (payload.id ?? payload.delivery_id ?? payload.wolt_delivery_id) as string | undefined;
  const woltStatus = String(payload.status ?? '').toLowerCase();
  const trackingObj = payload.tracking as Record<string, unknown> | undefined;
  const trackingUrl = (trackingObj?.url ?? payload.tracking_url) as string | undefined;

  if (!woltDeliveryId) return jsonResponse({ error: 'delivery id missing' }, 400);

  const internalStatus = WOLT_STATUS_MAP[woltStatus] ?? woltStatus;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: deliveryRow } = await supabase
    .from('delivery_orders')
    .select('id, sale_id')
    .eq('wolt_delivery_id', woltDeliveryId)
    .maybeSingle();

  if (!deliveryRow) return jsonResponse({ error: 'Delivery order not found' }, 404);

  await supabase
    .from('delivery_orders')
    .update({
      status: internalStatus,
      tracking_url: trackingUrl ?? null,
      raw_payload: payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', deliveryRow.id);

  // Mirror key milestones to sales.order_status for real-time UI updates
  if (woltStatus === 'delivered') {
    await supabase
      .from('sales')
      .update({ order_status: 'completed' })
      .eq('id', deliveryRow.sale_id as string);
  } else if (woltStatus === 'picked_up') {
    await supabase
      .from('sales')
      .update({ order_status: 'ready' })
      .eq('id', deliveryRow.sale_id as string);
  }

  return jsonResponse({ ok: true });
});
