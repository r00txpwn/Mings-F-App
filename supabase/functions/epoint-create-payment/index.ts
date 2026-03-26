import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsPreflightResponse, jsonResponse } from '../_shared/cors.ts';

/**
 * Creates a pending E-point payment row and returns a checkout URL placeholder.
 * Real signing / redirect URL must follow the official E-point merchant API (verify HMAC, endpoints, fields).
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
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
    .select('id, total_price, payment_status, source')
    .eq('id', saleId)
    .maybeSingle();

  if (sErr || !sale) return jsonResponse({ error: 'Sale not found' }, 404);
  if (!['online_delivery', 'online_takeaway'].includes(String(sale.source))) {
    return jsonResponse({ error: 'Not an online sale' }, 400);
  }
  if (sale.payment_status !== 'pending') {
    return jsonResponse({ error: 'Payment already processed or not pending card payment' }, 400);
  }

  const publicKey = Deno.env.get('EPOINT_PUBLIC_KEY') ?? '';
  const appBase = Deno.env.get('APP_BASE_URL') ?? '';
  if (!publicKey || !appBase) {
    return jsonResponse({ error: 'E-point not configured (EPOINT_PUBLIC_KEY, APP_BASE_URL)' }, 503);
  }

  const externalId = `ep_${saleId}_${Date.now()}`;
  const amount = Number(sale.total_price);

  const { data: payRow, error: pErr } = await supabase
    .from('online_payments')
    .insert({
      sale_id: saleId,
      provider: 'epoint',
      external_id: externalId,
      amount,
      currency: 'AZN',
      status: 'pending',
      raw_payload: { created_via: 'epoint-create-payment' },
    })
    .select('id')
    .single();

  if (pErr || !payRow) return jsonResponse({ error: pErr?.message ?? 'Failed to create payment' }, 500);

  const returnUrl = `${appBase.replace(/\/$/, '')}/order?paid=1&sale=${saleId}`;
  const checkoutUrl = `${appBase.replace(/\/$/, '')}/order?epoint=1&paymentId=${payRow.id}&sale=${saleId}`;

  return jsonResponse({
    paymentId: payRow.id,
    externalId,
    amount,
    checkoutUrl,
    returnUrl,
    message:
      'Sandbox placeholder: wire checkoutUrl to E-point hosted payment per official docs; verify signing with EPOINT_PRIVATE_KEY server-side only.',
  });
});
