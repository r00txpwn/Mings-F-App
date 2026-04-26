import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, corsPreflightResponse, jsonResponse } from '../_shared/cors.ts';
import * as UnitedPayment from '../_shared/unitedPayment.ts';

type PaymentRow = {
  id: string;
  sale_id: string;
  status: string | null;
  external_id: string | null;
  epoint_transaction: string | null;
};

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function readBearerSecret(req: Request): string | null {
  const h = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!h?.toLowerCase().startsWith('bearer ')) return null;
  return h.slice(7).trim();
}

function verifySecret(req: Request): boolean {
  const expected = (Deno.env.get('PAYMENT_RECONCILE_SECRET') ?? '').trim();
  if (!expected) return false;
  const got = readBearerSecret(req);
  return got != null && timingSafeEqualString(got, expected);
}

async function loadPayment(
  supabase: SupabaseClient,
  body: Record<string, unknown>
): Promise<PaymentRow | null> {
  const paymentId = body.online_payment_id != null ? String(body.online_payment_id) : '';
  if (paymentId) {
    const byId = await supabase
      .from('online_payments')
      .select('id, sale_id, status, external_id, epoint_transaction')
      .eq('provider', 'united_payment')
      .eq('id', paymentId)
      .maybeSingle();
    if (!byId.error && byId.data) return byId.data as PaymentRow;
  }

  const saleId = body.sale_id != null ? String(body.sale_id) : '';
  if (saleId) {
    const bySale = await supabase
      .from('online_payments')
      .select('id, sale_id, status, external_id, epoint_transaction')
      .eq('provider', 'united_payment')
      .eq('sale_id', saleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!bySale.error && bySale.data) return bySale.data as PaymentRow;
  }

  return null;
}

async function applyPaymentStatus(
  supabase: SupabaseClient,
  payment: PaymentRow,
  providerStatus: string,
  rawPayload: Record<string, unknown>
): Promise<'success' | 'failed' | 'pending'> {
  const mapped = UnitedPayment.mapProviderStatus(providerStatus);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    epoint_status: providerStatus,
    raw_payload: rawPayload,
    updated_at: now,
  };
  if (mapped === 'success') {
    patch.status = 'success';
    patch.paid_at = now;
    patch.error_message = null;
  } else if (mapped === 'failed') {
    patch.status = 'failed';
    patch.error_message = `United Payment status: ${providerStatus}`;
  } else {
    patch.status = 'pending';
  }

  await supabase.from('online_payments').update(patch).eq('id', payment.id);
  if (mapped === 'success') {
    await supabase.from('sales').update({ payment_status: 'paid' }).eq('id', payment.sale_id);
  } else if (mapped === 'failed') {
    await supabase.from('sales').update({ payment_status: 'failed' }).eq('id', payment.sale_id);
  }
  return mapped;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  if (req.method !== 'POST') return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);
  if (!verifySecret(req)) return jsonResponse({ ok: false, error: 'AUTH_INVALID' }, 401);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: 'INVALID_JSON' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const payment = await loadPayment(supabase, body);
  if (!payment) return jsonResponse({ ok: false, error: 'NOT_FOUND' }, 404);
  if (!payment.external_id && !payment.epoint_transaction) {
    return jsonResponse({ ok: false, error: 'MISSING_PROVIDER_REFERENCE' }, 400);
  }

  const token = await UnitedPayment.getAuthToken();
  const statusResult = payment.epoint_transaction
    ? await UnitedPayment.statusByTransactionId(token, payment.epoint_transaction)
    : await UnitedPayment.statusByClientOrderId(token, payment.external_id!);
  if (!statusResult.ok) {
    return jsonResponse(
      { ok: false, error: 'PROVIDER_ERROR', detail: statusResult.message, provider_response: statusResult.raw },
      502
    );
  }

  const providerStatus = statusResult.orderStatus ?? statusResult.status ?? 'PENDING';
  const mapped = await applyPaymentStatus(supabase, payment, providerStatus, {
    source: 'united-payment-status-check',
    status_check: statusResult.raw,
  });
  return new Response(JSON.stringify({ ok: true, mapped, providerStatus, provider_response: statusResult.raw }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
