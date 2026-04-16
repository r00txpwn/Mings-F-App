import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { epointSignature } from '../_shared/epointSign.ts';

/**
 * Epoint posts to this webhook with Content-Type: application/x-www-form-urlencoded
 * Body params: data (base64 JSON) + signature (base64 SHA1 raw).
 * Verification: recompute signature using EPOINT_PRIVATE_KEY and compare.
 */
async function verifyEpointCallback(data: string, signature: string, privateKey: string): Promise<boolean> {
  if (!privateKey) return true; // skip verification in dev when key not set
  const expected = await epointSignature(privateKey, data);
  return expected === signature;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const privateKey = Deno.env.get('EPOINT_PRIVATE_KEY') ?? '';
  const contentType = req.headers.get('content-type') ?? '';

  let data: string;
  let signature: string;

  // Epoint sends URL-encoded form; accept JSON fallback for testing
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    data = params.get('data') ?? '';
    signature = params.get('signature') ?? '';
  } else {
    let json: Record<string, unknown>;
    try {
      json = await req.json() as Record<string, unknown>;
    } catch {
      return jsonResponse({ error: 'Invalid body' }, 400);
    }
    data = String(json.data ?? '');
    signature = String(json.signature ?? '');
  }

  if (!data) return jsonResponse({ error: 'data param required' }, 400);

  if (!(await verifyEpointCallback(data, signature, privateKey))) {
    return jsonResponse({ error: 'Invalid signature' }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(atob(data)) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Invalid data encoding' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Epoint payload fields: order_id (our externalId), status, bank_transaction_id, rrn, bank_response_code
  const externalId = (payload.order_id ?? payload.external_id ?? payload.externalId) as string | undefined;
  const saleId = (payload.sale_id ?? payload.saleId) as string | undefined;
  const status = String(payload.status ?? '').toLowerCase();

  if (!externalId && !saleId) {
    return jsonResponse({ error: 'order_id or sale_id required' }, 400);
  }

  const payRes = externalId
    ? await supabase.from('online_payments').select('id, sale_id').eq('external_id', externalId).maybeSingle()
    : await supabase.from('online_payments').select('id, sale_id').eq('sale_id', saleId!).maybeSingle();

  const pay = payRes.data;
  if (payRes.error || !pay) return jsonResponse({ error: 'Payment not found' }, 404);

  // Epoint statuses: success, error, returned, server_error
  const paid = status === 'success';
  const failed = status === 'error' || status === 'returned' || status === 'server_error';

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

    // Auto-dispatch Wolt Drive for paid delivery orders
    const { data: saleRow } = await supabase
      .from('sales')
      .select('source')
      .eq('id', pay.sale_id as string)
      .maybeSingle();

    if (saleRow?.source === 'online_delivery') {
      const woltUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/wolt-drive-create`;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      // Fire-and-forget — don't delay the webhook response
      fetch(woltUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ saleId: pay.sale_id }),
      }).catch((err) => console.error('Wolt Drive dispatch error:', err));
    }
  } else if (failed) {
    await supabase
      .from('sales')
      .update({ payment_status: 'failed' })
      .eq('id', pay.sale_id as string);
  }

  return jsonResponse({ ok: true });
});
