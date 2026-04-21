import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import * as Epoint from '../_shared/epoint.ts';

const LEGACY_SECRET = () => (Deno.env.get('EPOINT_WEBHOOK_SECRET') ?? '').trim();

/** Legacy dev webhook: plain JSON + optional HMAC-SHA256 (see DEPLOY.md). */
async function verifyLegacyHmac(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
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

function opCode(cb: Record<string, unknown>): string {
  const v = cb.operation_code ?? cb.operationCode;
  return v != null ? String(v) : '';
}

function str(cb: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = cb[k];
    if (v != null && String(v).length > 0) return String(v);
  }
  return undefined;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const rawBody = await req.text();
  const contentType = req.headers.get('content-type');
  const privateKey = (Deno.env.get('EPOINT_PRIVATE_KEY') ?? '').trim();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // --- Epoint production: data + signature (SHA1) ---
  const parsed = Epoint.parseEpointCallbackBody(rawBody, contentType);
  if (parsed) {
    if (!privateKey) {
      console.error('epoint-webhook: EPOINT_PRIVATE_KEY required for signed callbacks');
      return jsonResponse({ received: true, error: 'Misconfigured' }, 503);
    }
    const ok = Epoint.verifySignature(privateKey, parsed.data, parsed.signature);
    if (!ok) {
      console.error('epoint-webhook: invalid Epoint signature');
      return jsonResponse({ received: true, error: 'Invalid signature' }, 200);
    }

    let callbackData: Record<string, unknown>;
    try {
      callbackData = Epoint.decodeData<Record<string, unknown>>(parsed.data);
    } catch (e) {
      console.error('epoint-webhook: decode failed', e);
      return jsonResponse({ received: true, error: 'Invalid data' }, 200);
    }

    const orderId = str(callbackData, 'order_id', 'orderId');
    if (!orderId) {
      return jsonResponse({ received: true, error: 'order_id missing' }, 200);
    }

    const code = opCode(callbackData);
    if (code === '001') {
      await handleCardRegistrationOnly(supabase, callbackData, orderId);
    } else if (code === '200') {
      await handleCardRegistrationWithPayment(supabase, callbackData, orderId);
    } else {
      await handleStandardPayment(supabase, callbackData, orderId);
    }

    return jsonResponse({ received: true }, 200);
  }

  // --- Legacy JSON webhook (sandbox / internal tests) ---
  const legacySecret = LEGACY_SECRET();
  const sig = req.headers.get('X-Epoint-Signature') ?? req.headers.get('x-signature');
  if (legacySecret && (await verifyLegacyHmac(rawBody, sig, legacySecret))) {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }
    const saleId = (payload.sale_id ?? payload.saleId) as string | undefined;
    const externalId = (payload.external_id ?? payload.externalId) as string | undefined;
    if (!externalId && !saleId) {
      return jsonResponse({ error: 'external_id or sale_id required' }, 400);
    }
    const payRes = externalId
      ? await supabase.from('online_payments').select('id, sale_id').eq('external_id', externalId).maybeSingle()
      : await supabase.from('online_payments').select('id, sale_id').eq('sale_id', saleId!).maybeSingle();
    const pay = payRes.data;
    if (payRes.error || !pay) return jsonResponse({ error: 'Payment not found' }, 404);
    const status = String(payload.status ?? payload.payment_status ?? '').toLowerCase();
    const paid = status === 'success' || status === 'completed' || status === 'paid';
    const failed = status === 'failed' || status === 'cancelled';
    await supabase
      .from('online_payments')
      .update({
        status: paid ? 'success' : failed ? 'failed' : 'pending',
        raw_payload: payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pay.id);
    if (paid) {
      await supabase.from('sales').update({ payment_status: 'paid' }).eq('id', pay.sale_id as string);
    } else if (failed) {
      await supabase.from('sales').update({ payment_status: 'failed' }).eq('id', pay.sale_id as string);
    }
    return jsonResponse({ ok: true });
  }

  if (!privateKey && !legacySecret) {
    return jsonResponse({ error: 'EPOINT_PRIVATE_KEY or EPOINT_WEBHOOK_SECRET not configured' }, 503);
  }

  console.error('epoint-webhook: unrecognized body (need data+signature or legacy HMAC JSON)');
  return jsonResponse({ received: true, error: 'Unrecognized callback format' }, 200);
});

async function findLatestPayment(
  supabase: SupabaseClient,
  saleId: string
): Promise<{ id: string; sale_id: string } | null> {
  const { data, error } = await supabase
    .from('online_payments')
    .select('id, sale_id')
    .eq('sale_id', saleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as { id: string; sale_id: string };
}

async function applyPaymentUpdate(
  supabase: SupabaseClient,
  payId: string,
  saleId: string,
  callbackData: Record<string, unknown>,
  success: boolean,
  failed: boolean
): Promise<void> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    epoint_transaction: str(callbackData, 'transaction'),
    bank_transaction: str(callbackData, 'bank_transaction', 'bankTransaction'),
    rrn: str(callbackData, 'rrn'),
    card_mask: str(callbackData, 'card_mask', 'cardMask'),
    card_name: str(callbackData, 'card_name', 'cardName'),
    epoint_status: str(callbackData, 'status'),
    bank_response_code: str(callbackData, 'code', 'bank_response_code'),
    raw_payload: callbackData,
    updated_at: now,
  };
  if (success) {
    patch.status = 'success';
    patch.paid_at = now;
    patch.error_message = null;
  } else if (failed) {
    patch.status = 'failed';
    patch.error_message = str(callbackData, 'message') ?? 'Payment failed';
  } else {
    patch.status = 'pending';
  }

  await supabase.from('online_payments').update(patch).eq('id', payId);

  if (success) {
    await supabase.from('sales').update({ payment_status: 'paid' }).eq('id', saleId);
  } else if (failed) {
    await supabase.from('sales').update({ payment_status: 'failed' }).eq('id', saleId);
  }
}

async function handleStandardPayment(
  supabase: SupabaseClient,
  callbackData: Record<string, unknown>,
  orderId: string
): Promise<void> {
  const pay = await findLatestPayment(supabase, orderId);
  if (!pay) {
    console.error(`epoint-webhook: payment not found for sale ${orderId}`);
    return;
  }
  const st = (str(callbackData, 'status') ?? '').toLowerCase();
  const success = st === 'success';
  const failed = st === 'error' || st === 'failed' || st === 'returned';
  await applyPaymentUpdate(supabase, pay.id, pay.sale_id, callbackData, success, failed);
}

async function handleCardRegistrationOnly(
  supabase: SupabaseClient,
  callbackData: Record<string, unknown>,
  orderId: string
): Promise<void> {
  const st = (str(callbackData, 'status') ?? '').toLowerCase();
  const cardId = str(callbackData, 'card_id', 'cardId');
  if (st === 'success' && cardId) {
    const { data: sale } = await supabase
      .from('sales')
      .select('customer_user_id')
      .eq('id', orderId)
      .maybeSingle();
    const uid = sale?.customer_user_id as string | null | undefined;
    if (uid) {
      await supabase.from('saved_cards').insert({
        user_id: uid,
        epoint_card_id: cardId,
        card_mask: str(callbackData, 'card_mask', 'cardMask') ?? '****',
        card_name: str(callbackData, 'card_name', 'cardName'),
        card_brand: str(callbackData, 'card_brand', 'cardBrand'),
        is_active: true,
      });
    }
  }
}

async function handleCardRegistrationWithPayment(
  supabase: SupabaseClient,
  callbackData: Record<string, unknown>,
  orderId: string
): Promise<void> {
  await handleStandardPayment(supabase, callbackData, orderId);
  const st = (str(callbackData, 'status') ?? '').toLowerCase();
  const cardId = str(callbackData, 'card_id', 'cardId');
  if (st === 'success' && cardId) {
    const { data: sale } = await supabase
      .from('sales')
      .select('customer_user_id')
      .eq('id', orderId)
      .maybeSingle();
    const uid = sale?.customer_user_id as string | null | undefined;
    if (uid) {
      const mask = str(callbackData, 'card_mask', 'cardMask') ?? '****';
      const { data: existing } = await supabase
        .from('saved_cards')
        .select('id')
        .eq('user_id', uid)
        .eq('epoint_card_id', cardId)
        .maybeSingle();
      if (!existing) {
        await supabase.from('saved_cards').insert({
          user_id: uid,
          epoint_card_id: cardId,
          card_mask: mask,
          card_name: str(callbackData, 'card_name', 'cardName'),
          card_brand: str(callbackData, 'card_brand', 'cardBrand'),
          is_active: true,
        });
      }
    }
  }
}
