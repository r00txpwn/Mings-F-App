import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsPreflightResponse, jsonResponse } from '../_shared/cors.ts';

const LOCK_MS = 60_000;

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

  let body: { saleId?: string };
  try {
    body = (await req.json()) as { saleId?: string };
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const saleId = body.saleId?.trim();
  if (!saleId) return jsonResponse({ error: 'saleId required' }, 400);

  const { data: sale, error: sErr } = await supabase
    .from('sales')
    .select('id, source')
    .eq('id', saleId)
    .maybeSingle();

  if (sErr || !sale) return jsonResponse({ error: 'Sale not found' }, 404);
  if (sale.source !== 'online_delivery') {
    return jsonResponse({ error: 'Only delivery orders can use Wolt booking lock' }, 400);
  }

  const until = new Date(Date.now() + LOCK_MS).toISOString();

  const { data: existing } = await supabase
    .from('delivery_orders')
    .select('id')
    .eq('sale_id', saleId)
    .maybeSingle();

  if (existing) {
    const { error: upErr } = await supabase
      .from('delivery_orders')
      .update({ wolt_booking_locked_until: until, updated_at: until })
      .eq('sale_id', saleId);
    if (upErr) return jsonResponse({ error: upErr.message }, 500);
  } else {
    const { error: insErr } = await supabase.from('delivery_orders').insert({
      sale_id: saleId,
      wolt_delivery_id: `wolt_book_lock_${saleId}`,
      status: 'created',
      tracking_url: null,
      raw_payload: { note: 'Wolt booking lock; staff opened portal from kiosk.' },
      wolt_booking_locked_until: until,
      updated_at: until,
    });
    if (insErr) return jsonResponse({ error: insErr.message }, 500);
  }

  return jsonResponse({ ok: true, lockedUntil: until });
});
