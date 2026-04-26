import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import * as UnitedPayment from '../_shared/unitedPayment.ts';

type PaymentRow = {
  id: string;
  sale_id: string;
  status: string | null;
  external_id: string | null;
  epoint_transaction: string | null;
};

function str(payload: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return null;
}

function parsePayloadFromRaw(rawText: string, contentType: string): Record<string, unknown> {
  if (contentType.includes('application/json')) {
    return JSON.parse(rawText) as Record<string, unknown>;
  }
  const params = new URLSearchParams(rawText);
  return Object.fromEntries(params.entries());
}

async function loadPayment(
  supabase: SupabaseClient,
  clientOrderId: string | null,
  transactionId: string | null
): Promise<PaymentRow | null> {
  if (transactionId) {
    const byTx = await supabase
      .from('online_payments')
      .select('id, sale_id, status, external_id, epoint_transaction')
      .eq('provider', 'united_payment')
      .eq('epoint_transaction', transactionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!byTx.error && byTx.data) return byTx.data as PaymentRow;
  }
  if (!clientOrderId) return null;
  const byOrder = await supabase
    .from('online_payments')
    .select('id, sale_id, status, external_id, epoint_transaction')
    .eq('provider', 'united_payment')
    .eq('external_id', clientOrderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (byOrder.error || !byOrder.data) return null;
  return byOrder.data as PaymentRow;
}

async function applyPaymentStatus(
  supabase: SupabaseClient,
  payment: PaymentRow,
  providerStatus: string,
  payload: Record<string, unknown>,
  transactionId: string | null
): Promise<'success' | 'failed' | 'pending'> {
  const mapped = UnitedPayment.mapProviderStatus(providerStatus);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    epoint_transaction: transactionId ?? payment.epoint_transaction,
    epoint_status: providerStatus,
    raw_payload: payload,
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
    await supabase
      .from('sales')
      .update({ order_status: 'pending' })
      .eq('id', payment.sale_id)
      .eq('order_status', 'awaiting_payment');
  } else if (mapped === 'failed') {
    await supabase.from('sales').update({ payment_status: 'failed' }).eq('id', payment.sale_id);
  }
  return mapped;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const rawBytes = new Uint8Array(await req.arrayBuffer());
  const contentType = (req.headers.get('content-type') ?? '').toLowerCase();
  const xSignature = req.headers.get('X-Signature') ?? req.headers.get('x-signature');

  if (!UnitedPayment.verifyUnitedPaymentWebhookSignature(rawBytes, xSignature)) {
    console.error('united-payment-webhook: invalid signature');
    return jsonResponse({ received: true, error: 'Invalid signature' }, 200);
  }

  let payload: Record<string, unknown>;
  try {
    const rawText = new TextDecoder().decode(rawBytes);
    payload = parsePayloadFromRaw(rawText, contentType);
  } catch {
    return jsonResponse({ error: 'Invalid payload' }, 400);
  }

  const transactionId = str(payload, 'transactionId', 'TransactionId');
  const clientOrderId = str(payload, 'clientOrderId', 'ClientOrderId');
  const providerStatus = str(payload, 'status', 'Status');
  if (!providerStatus) {
    return jsonResponse({ received: true, error: 'status missing' }, 200);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const payment = await loadPayment(supabase, clientOrderId, transactionId);
  if (!payment) {
    console.error('united-payment-webhook: payment not found', { transactionId, clientOrderId });
    return jsonResponse({ received: true, error: 'Payment not found' }, 200);
  }

  if (payment.status === 'success' && UnitedPayment.mapProviderStatus(providerStatus) === 'success') {
    return jsonResponse({ received: true, ok: true, status: 'already_success' });
  }

  const mapped = await applyPaymentStatus(supabase, payment, providerStatus, payload, transactionId);
  return jsonResponse({ received: true, ok: true, mapped });
});
