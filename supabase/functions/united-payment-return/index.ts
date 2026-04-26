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

function storefrontUrl(query: URLSearchParams): string {
  const appBase = (Deno.env.get('APP_BASE_URL') ?? '').trim().replace(/\/$/, '');
  const storefrontPath = (Deno.env.get('APP_STOREFRONT_PATH') ?? '/order').trim() || '/order';
  if (!appBase) return '';
  if (storefrontPath === '/' || storefrontPath === '') return `${appBase}/?${query.toString()}`;
  const path = storefrontPath.startsWith('/') ? storefrontPath : `/${storefrontPath}`;
  return `${appBase}${path}?${query.toString()}`;
}

function redirectToStorefront(params: URLSearchParams): Response {
  const target = storefrontUrl(params);
  if (!target) return jsonResponse({ error: 'APP_BASE_URL required' }, 503);
  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      Location: target,
    },
  });
}

async function loadPayment(
  supabase: SupabaseClient,
  saleId: string | null,
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
  if (!saleId) return null;
  const bySale = await supabase
    .from('online_payments')
    .select('id, sale_id, status, external_id, epoint_transaction')
    .eq('provider', 'united_payment')
    .eq('sale_id', saleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (bySale.error || !bySale.data) return null;
  return bySale.data as PaymentRow;
}

async function applyPaymentStatus(
  supabase: SupabaseClient,
  payment: PaymentRow,
  providerStatus: string,
  rawPayload: Record<string, unknown>,
  transactionId: string | null
): Promise<'success' | 'failed' | 'pending'> {
  const mapped = UnitedPayment.mapProviderStatus(providerStatus);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    epoint_transaction: transactionId ?? payment.epoint_transaction,
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
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

  const url = new URL(req.url);
  const saleId = url.searchParams.get('sale');
  const kind = url.searchParams.get('kind');
  const transactionId = url.searchParams.get('transactionId') ?? url.searchParams.get('transaction_id');
  const redirectStatus = url.searchParams.get('status');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const payment = await loadPayment(supabase, saleId, transactionId);
  if (!payment) {
    const params = new URLSearchParams({ payment_error: '1', message: 'Payment record not found' });
    if (saleId) params.set('sale', saleId);
    return redirectToStorefront(params);
  }

  let providerStatus = redirectStatus ?? (kind === 'success' ? 'PENDING' : 'FAILED');
  let providerRaw: Record<string, unknown> = {
    source: 'united-payment-return',
    kind,
    redirectStatus,
    transactionId,
    query: Object.fromEntries(url.searchParams.entries()),
  };

  try {
    const token = await UnitedPayment.getAuthToken();
    const statusResult = transactionId
      ? await UnitedPayment.statusByTransactionId(token, transactionId)
      : payment.external_id
        ? await UnitedPayment.statusByClientOrderId(token, payment.external_id)
        : null;
    if (statusResult?.ok) {
      providerStatus = statusResult.orderStatus ?? statusResult.status ?? providerStatus;
      providerRaw = {
        ...providerRaw,
        status_check: statusResult.raw,
      };
    } else if (statusResult) {
      providerRaw = {
        ...providerRaw,
        status_check_error: statusResult.message ?? 'Status check failed',
        status_check: statusResult.raw,
      };
    }
  } catch (e) {
    providerRaw = {
      ...providerRaw,
      status_check_error: e instanceof Error ? e.message : String(e),
    };
  }

  const mapped = await applyPaymentStatus(supabase, payment, providerStatus, providerRaw, transactionId);
  const params = new URLSearchParams();
  params.set('sale', payment.sale_id);
  if (mapped === 'success') {
    params.set('paid', '1');
  } else if (mapped === 'failed') {
    params.set('payment_error', '1');
    params.set('message', kind === 'cancel' ? 'Payment cancelled' : 'Payment failed');
  } else {
    params.set('payment_pending', '1');
  }
  return redirectToStorefront(params);
});
