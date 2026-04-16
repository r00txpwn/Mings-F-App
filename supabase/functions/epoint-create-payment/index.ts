import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsPreflightResponse, jsonResponse } from '../_shared/cors.ts';
import { epointData, epointSignature } from '../_shared/epointSign.ts';

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
    .select('id, total_price, payment_status, source, display_number, track_token')
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
  const privateKey = Deno.env.get('EPOINT_PRIVATE_KEY') ?? '';
  const appBase = Deno.env.get('APP_BASE_URL') ?? '';

  if (!publicKey || !appBase) {
    return jsonResponse({ error: 'E-point not configured (EPOINT_PUBLIC_KEY, APP_BASE_URL)' }, 503);
  }

  const externalId = `ep_${saleId}_${Date.now()}`;
  const amount = Number(sale.total_price);
  const trackToken = (sale.track_token as string | null) ?? saleId;

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

  const baseUrl = appBase.replace(/\/$/, '');
  const successUrl = `${baseUrl}/track?token=${trackToken}&paid=1`;
  const errorUrl = `${baseUrl}/track?token=${trackToken}&paid=0`;

  // If no private key configured, return sandbox placeholder (dev mode)
  if (!privateKey) {
    return jsonResponse({
      paymentId: payRow.id,
      externalId,
      amount,
      checkoutUrl: `${baseUrl}/order?epoint=1&paymentId=${payRow.id}&sale=${saleId}`,
      returnUrl: successUrl,
      message: 'Sandbox placeholder: set EPOINT_PRIVATE_KEY to enable real Epoint checkout.',
    });
  }

  // Build signed Epoint payload
  const epointPayload: Record<string, unknown> = {
    public_key: publicKey,
    amount: amount.toFixed(2),
    currency: 'AZN',
    language: 'az',
    order_id: externalId,
    description: `Order #${sale.display_number ?? saleId}`,
    success_redirect_url: successUrl,
    error_redirect_url: errorUrl,
  };

  const data = epointData(epointPayload);
  const signature = await epointSignature(privateKey, data);

  let checkoutUrl: string;
  try {
    const epointRes = await fetch('https://epoint.az/api/1/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_key: publicKey, data, signature }),
    });
    const epointJson = await epointRes.json() as Record<string, unknown>;

    if (!epointRes.ok || epointJson.status !== 'success' || !epointJson.redirect_url) {
      console.error('Epoint API error:', JSON.stringify(epointJson));
      return jsonResponse({ error: 'Epoint payment initiation failed', detail: epointJson }, 502);
    }
    checkoutUrl = epointJson.redirect_url as string;
  } catch (err) {
    console.error('Epoint fetch error:', err);
    return jsonResponse({ error: 'Failed to reach Epoint API' }, 502);
  }

  return jsonResponse({
    paymentId: payRow.id,
    externalId,
    amount,
    checkoutUrl,
    returnUrl: successUrl,
  });
});
