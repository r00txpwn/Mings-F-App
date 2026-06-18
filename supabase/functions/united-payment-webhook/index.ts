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
  if (req.method !== 'POST') return jsonResponse({ received: true, error: 'Method not allowed' }, 200);

  const rawBytes = new Uint8Array(await req.arrayBuffer());
  const contentType = (req.headers.get('content-type') ?? '').toLowerCase();
  const xSignature = req.headers.get('X-Signature') ?? req.headers.get('x-signature');

  if (!UnitedPayment.verifyUnitedPaymentWebhookSignature(rawBytes, xSignature)) {
    console.error('united-payment-webhook: invalid signature');
    return jsonResponse({ received: true, error: 'Invalid signature' }, 200);
  }

  let parsed: UnitedPayment.UnitedPaymentReturnData;
  try {
    const rawText = new TextDecoder().decode(rawBytes);
    if (contentType.includes('application/json')) {
      parsed = UnitedPayment.parseUnitedPaymentReturn(JSON.parse(rawText) as Record<string, unknown>);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      parsed = UnitedPayment.parseUnitedPaymentReturn(rawText);
    } else {
      parsed = UnitedPayment.parseUnitedPaymentReturn(rawText);
    }
  } catch {
    return jsonResponse({ received: true, error: 'Invalid payload' }, 200);
  }

  const clientOrderId = parsed.clientOrderId;
  const transactionId = parsed.transactionId;
  const notifyStatus = parsed.status;

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

  const confirmed = await UnitedPayment.confirmProviderStatus({
    clientOrderId: clientOrderId ?? payment.external_id,
    transactionId: transactionId ?? payment.epoint_transaction,
  });

  const providerStatus = confirmed.ok ? confirmed.status : notifyStatus ?? 'PENDING';
  const providerRaw: Record<string, unknown> = {
    source: 'united-payment-webhook',
    notify: parsed.decoded,
    notifyStatus,
    status_check: confirmed.result?.raw ?? null,
    status_check_ok: confirmed.ok,
    status_check_message: confirmed.message ?? null,
  };

  if (payment.status === 'success' && UnitedPayment.mapProviderStatus(providerStatus) === 'success') {
    return jsonResponse({ received: true, ok: true, status: 'already_success' }, 200);
  }

  const mapped = await applyPaymentStatus(
    supabase,
    payment,
    providerStatus,
    providerRaw,
    transactionId ?? payment.epoint_transaction
  );
  return jsonResponse({ received: true, ok: true, mapped, confirmed: confirmed.ok }, 200);
});
