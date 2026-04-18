import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsPreflightResponse, jsonResponse } from '../_shared/cors.ts';

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) return jsonResponse({ error: 'Server misconfigured' }, 500);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing authorization' }, 401);
  }
  const token = authHeader.slice(7).trim();
  if (!token || token === anonKey) return jsonResponse({ error: 'Staff session required' }, 401);

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user?.id) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { data: staffRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  const role = (staffRow as { role?: string } | null)?.role;
  if (role !== 'admin' && role !== 'staff') {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  let body: { saleId?: string; trackingUrl?: string };
  try {
    body = (await req.json()) as { saleId?: string; trackingUrl?: string };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const saleId = body.saleId?.trim();
  const trackingUrl = body.trackingUrl?.trim();
  if (!saleId) return jsonResponse({ error: 'saleId required' }, 400);
  if (!trackingUrl || !isValidHttpUrl(trackingUrl)) {
    return jsonResponse({ error: 'Valid trackingUrl required' }, 400);
  }

  const { data: sale, error: sErr } = await supabase
    .from('sales')
    .select('id, source')
    .eq('id', saleId)
    .maybeSingle();

  if (sErr || !sale) return jsonResponse({ error: 'Sale not found' }, 404);
  if (sale.source !== 'online_delivery') {
    return jsonResponse({ error: 'Only delivery orders can be dispatched' }, 400);
  }

  const now = new Date().toISOString();
  const { data: dRow, error: dErr } = await supabase
    .from('delivery_orders')
    .upsert(
      {
        sale_id: saleId,
        status: 'dispatched',
        tracking_url: trackingUrl,
        manually_dispatched: true,
        updated_at: now,
      },
      { onConflict: 'sale_id' }
    )
    .select('id')
    .single();

  if (dErr) return jsonResponse({ error: dErr.message }, 500);

  const { error: uErr } = await supabase
    .from('sales')
    .update({ order_status: 'dispatched' })
    .eq('id', saleId);

  if (uErr) return jsonResponse({ error: uErr.message }, 500);

  return jsonResponse({ ok: true, delivery_order_id: dRow?.id });
});
