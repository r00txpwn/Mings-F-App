import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsPreflightResponse, jsonResponse } from '../_shared/cors.ts';
import * as UnitedPayment from '../_shared/unitedPayment.ts';

type Body = {
  saleId?: string;
  paymentInitToken?: string;
  language?: string;
};

type SaleRow = {
  id: string;
  total_price: number | string;
  payment_status: string | null;
  source: string | null;
  display_number: string | null;
  customer_user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  payment_init_token: string | null;
  created_at: string | null;
  online_payment_id: string | null;
};

function paymentReturnFunctionBase(): string {
  const explicit = (Deno.env.get('UNITED_PAYMENT_FUNCTIONS_PUBLIC_URL') ?? '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') ?? '').trim().replace(/\/$/, '');
  return supabaseUrl ? `${supabaseUrl}/functions/v1` : '';
}

function storefrontUrl(query: string): string {
  const appBase = (Deno.env.get('APP_BASE_URL') ?? '').trim().replace(/\/$/, '');
  const storefrontPath = (Deno.env.get('APP_STOREFRONT_PATH') ?? '/order').trim() || '/order';
  if (!appBase) return '';
  if (storefrontPath === '/' || storefrontPath === '') return `${appBase}/?${query}`;
  const path = storefrontPath.startsWith('/') ? storefrontPath : `/${storefrontPath}`;
  return `${appBase}${path}?${query}`;
}

function providerReturnUrl(kind: 'success' | 'cancel' | 'decline', saleId: string): string {
  const base = paymentReturnFunctionBase();
  const params = new URLSearchParams({ kind, sale: saleId });
  return `${base}/united-payment-return?${params.toString()}`;
}

/** Only set when UNITED_PAYMENT_WEBHOOK_URL is set; checkout body omits webhookUrl otherwise. */
function webhookUrlFromEnv(): string | undefined {
  const explicit = (Deno.env.get('UNITED_PAYMENT_WEBHOOK_URL') ?? '').trim();
  return explicit || undefined;
}

function normalizeLanguage(input: string | undefined): UnitedPayment.UnitedPaymentLanguage {
  const lang = String(input ?? 'EN').trim().toUpperCase();
  if (lang === 'AZ' || lang === 'RU') return lang;
  return 'EN';
}

async function markSalePaymentInitFailed(
  supabase: ReturnType<typeof createClient>,
  saleId: string,
  reason: string
) {
  await supabase
    .from('sales')
    .update({
      payment_status: 'failed',
      order_status: 'cancelled',
      cancellation_reason: reason.slice(0, 300),
    })
    .eq('id', saleId);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const configured = UnitedPayment.configuredForCheckout();
  if (!configured.ok) {
    return jsonResponse(
      { error: 'United Payment is not configured', missing: configured.missing },
      503
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const saleId = body.saleId;
  const paymentInitToken = body.paymentInitToken?.trim() ?? '';
  if (!saleId) return jsonResponse({ error: 'saleId required' }, 400);
  if (!paymentInitToken) return jsonResponse({ error: 'paymentInitToken required' }, 400);

  let callerUserId: string | null = null;
  const authHeader = req.headers.get('Authorization');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token && token !== anonKey) {
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (!userErr && userData?.user?.id) callerUserId = userData.user.id;
    }
  }

  const { data: saleRaw, error: sErr } = await supabase
    .from('sales')
    .select('id, total_price, payment_status, source, display_number, customer_user_id, customer_name, customer_phone, payment_init_token, created_at, online_payment_id')
    .eq('id', saleId)
    .maybeSingle();

  const sale = saleRaw as SaleRow | null;
  if (sErr || !sale) return jsonResponse({ error: 'Sale not found' }, 404);
  if (!['online_delivery', 'online_takeaway'].includes(String(sale.source))) {
    return jsonResponse({ error: 'Not an online sale' }, 400);
  }
  if (sale.payment_status !== 'pending') {
    return jsonResponse({ error: 'Payment already processed or not pending card payment' }, 400);
  }
  if ((sale.payment_init_token ?? null) !== paymentInitToken) {
    return jsonResponse({ error: 'Invalid payment init token' }, 403);
  }
  const createdAt = new Date(String(sale.created_at ?? ''));
  if (Number.isNaN(createdAt.getTime()) || Date.now() - createdAt.getTime() > 20 * 60_000) {
    return jsonResponse({ error: 'paymentInitToken expired' }, 410);
  }
  if (sale.online_payment_id) {
    return jsonResponse({ error: 'Payment already initialized for this sale' }, 409);
  }
  if (sale.customer_user_id && !callerUserId) {
    return jsonResponse({ error: 'Authentication required for this sale' }, 401);
  }
  if (sale.customer_user_id && callerUserId && sale.customer_user_id !== callerUserId) {
    return jsonResponse({ error: 'Not allowed for this sale' }, 403);
  }

  const amount = Number(sale.total_price);
  if (!Number.isFinite(amount) || amount <= 0) return jsonResponse({ error: 'Invalid sale amount' }, 400);

  const functionBase = paymentReturnFunctionBase();
  if (!functionBase) {
    return jsonResponse({ error: 'UNITED_PAYMENT_FUNCTIONS_PUBLIC_URL or SUPABASE_URL required' }, 503);
  }
  if (!storefrontUrl('paid=1')) {
    return jsonResponse({ error: 'APP_BASE_URL required' }, 503);
  }

  const clientOrderId = `up_${saleId}_${Date.now()}`;
  const description = `Order ${sale.display_number ?? saleId}`;

  const { data: payRow, error: pErr } = await supabase
    .from('online_payments')
    .insert({
      sale_id: saleId,
      provider: 'united_payment',
      external_id: clientOrderId,
      amount,
      currency: 'AZN',
      status: 'pending',
      payment_method: 'card',
      raw_payload: { created_via: 'united-payment-create-payment' },
    })
    .select('id')
    .single();

  if (pErr || !payRow) return jsonResponse({ error: pErr?.message ?? 'Failed to create payment' }, 500);

  const paymentId = (payRow as { id: string }).id;
  await supabase.from('sales').update({ online_payment_id: paymentId }).eq('id', saleId);

  try {
    const token = await UnitedPayment.getAuthToken();
    const result = await UnitedPayment.createCheckout({
      token,
      clientOrderId,
      amount: UnitedPayment.normalizeAmount(amount),
      language: normalizeLanguage(body.language),
      successUrl: providerReturnUrl('success', saleId),
      cancelUrl: providerReturnUrl('cancel', saleId),
      declineUrl: providerReturnUrl('decline', saleId),
      webhookUrl: webhookUrlFromEnv(),
      description,
      memberId: sale.customer_user_id ?? undefined,
      phoneNumber: sale.customer_phone ?? undefined,
      clientName: sale.customer_name ?? undefined,
      additionalInformation: sale.display_number ?? saleId,
      applePay: true,
    });

    if (!result.ok || !result.checkoutUrl) {
      await supabase
        .from('online_payments')
        .update({
          status: 'failed',
          error_message: result.message ?? JSON.stringify(result.raw),
          raw_payload: { united_payment_create: result.raw },
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId);
      await markSalePaymentInitFailed(supabase, saleId, 'Card payment initialization failed');
      return jsonResponse({ error: 'United Payment checkout failed', details: result.raw }, 502);
    }

    await supabase
      .from('online_payments')
      .update({
        epoint_transaction: result.transactionId ?? null,
        raw_payload: { united_payment_create: result.raw },
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    return jsonResponse({
      paymentId,
      externalId: clientOrderId,
      transactionId: result.transactionId,
      amount,
      checkoutUrl: result.checkoutUrl,
      returnUrl: providerReturnUrl('success', saleId),
      type: 'redirect',
    });
  } catch (e) {
    await supabase
      .from('online_payments')
      .update({
        status: 'failed',
        error_message: e instanceof Error ? e.message : String(e),
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
    await markSalePaymentInitFailed(
      supabase,
      saleId,
      e instanceof Error ? `Card payment initialization failed: ${e.message}` : 'Card payment initialization failed'
    );
    console.error('united-payment-create-payment', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Payment init failed' }, 500);
  }
});
