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
    .select('id, source, order_status')
    .eq('id', saleId)
    .maybeSingle();

  if (sErr || !sale) return jsonResponse({ error: 'Sale not found' }, 404);
  if (sale.source !== 'online_delivery') {
    return jsonResponse({ error: 'Only delivery orders can be dispatched' }, 400);
  }

  const prevStatus = String(sale.order_status ?? '');

  const { data: existingDo } = await supabase
    .from('delivery_orders')
    .select('id, tracking_url')
    .eq('sale_id', saleId)
    .maybeSingle();

  if (prevStatus === 'dispatched') {
    if (existingDo?.tracking_url === trackingUrl) {
      return jsonResponse({ ok: true, delivery_order_id: existingDo.id, idempotent: true });
    }
    return jsonResponse({ error: 'Order already dispatched' }, 409);
  }

  if (prevStatus !== 'preparing' && prevStatus !== 'ready') {
    return jsonResponse({ error: 'Order must be preparing or ready before manual dispatch' }, 400);
  }

  const now = new Date().toISOString();

  const { data: updatedRows, error: uErr } = await supabase
    .from('sales')
    .update({ order_status: 'dispatched' })
    .eq('id', saleId)
    .in('order_status', ['preparing', 'ready'])
    .select('id');

  if (uErr) return jsonResponse({ error: uErr.message }, 500);
  if (!updatedRows?.length) {
    return jsonResponse({ error: 'Could not move order to dispatched (conflict or stale state)' }, 409);
  }

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

  if (dErr) {
    await supabase.from('sales').update({ order_status: prevStatus }).eq('id', saleId);
    return jsonResponse({ error: dErr.message }, 500);
  }

  return jsonResponse({ ok: true, delivery_order_id: dRow?.id });
});
