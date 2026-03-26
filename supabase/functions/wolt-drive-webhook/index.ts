import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const secret = Deno.env.get('WOLT_WEBHOOK_SECRET') ?? '';
  const sig = req.headers.get('X-Wolt-Signature') ?? req.headers.get('x-wolt-signature');
  const rawBody = await req.text();

  if (secret && sig !== secret) {
    return jsonResponse({ error: 'Invalid signature' }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const woltId = (payload.delivery_id ?? payload.id ?? payload.wolt_delivery_id) as string | undefined;
  const status = String(payload.status ?? 'updated');
  const trackingUrl = (payload.tracking_url ?? payload.trackingUrl) as string | undefined;

  if (!woltId) return jsonResponse({ error: 'delivery id missing' }, 400);

  await supabase
    .from('delivery_orders')
    .update({
      status,
      tracking_url: trackingUrl ?? null,
      raw_payload: payload,
      updated_at: new Date().toISOString(),
    })
    .eq('wolt_delivery_id', woltId);

  return jsonResponse({ ok: true });
});
