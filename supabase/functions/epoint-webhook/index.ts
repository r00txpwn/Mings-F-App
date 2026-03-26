import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

async function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const expected = signature.replace(/^sha256=/, '').trim();
  return hex === expected || signature === hex;
}

/**
 * E-point webhook — verify the real header/body format from E-point documentation before production.
 * Expects JSON: { external_id?: string, status?: string, sale_id?: string } and optional X-Epoint-Signature.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const secret = Deno.env.get('EPOINT_WEBHOOK_SECRET') ?? '';
  const rawBody = await req.text();
  const sig = req.headers.get('X-Epoint-Signature') ?? req.headers.get('x-signature');

  if (secret && !(await verifySignature(rawBody, sig, secret))) {
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

  const externalId = (payload.external_id ?? payload.externalId) as string | undefined;
  const status = String(payload.status ?? payload.payment_status ?? '').toLowerCase();
  const saleId = (payload.sale_id ?? payload.saleId) as string | undefined;

  if (!externalId && !saleId) {
    return jsonResponse({ error: 'external_id or sale_id required' }, 400);
  }

  const payRes = externalId
    ? await supabase.from('online_payments').select('id, sale_id').eq('external_id', externalId).maybeSingle()
    : await supabase.from('online_payments').select('id, sale_id').eq('sale_id', saleId!).maybeSingle();

  const pay = payRes.data;
  const error = payRes.error;
  if (error || !pay) return jsonResponse({ error: 'Payment not found' }, 404);

  const paid = status === 'success' || status === 'completed' || status === 'paid';
  const failed = status === 'failed' || status === 'cancelled';

  await supabase
    .from('online_payments')
    .update({
      status: paid ? 'completed' : failed ? 'failed' : 'pending',
      raw_payload: payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pay.id);

  if (paid) {
    await supabase
      .from('sales')
      .update({ payment_status: 'paid' })
      .eq('id', pay.sale_id as string);
  } else if (failed) {
    await supabase
      .from('sales')
      .update({ payment_status: 'failed' })
      .eq('id', pay.sale_id as string);
  }

  return jsonResponse({ ok: true });
});
