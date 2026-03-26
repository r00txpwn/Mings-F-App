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

  const { error } = await supabase
    .from('delivery_orders')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
      raw_payload: { cancelled: true },
    })
    .eq('sale_id', saleId);

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ ok: true });
});
