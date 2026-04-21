import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsPreflightResponse, jsonResponse } from '../_shared/cors.ts';
import * as Epoint from '../_shared/epoint.ts';

type Body = {
  saleId?: string;
  paymentInitToken?: string;
  saveCard?: boolean;
  useWallet?: boolean;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

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

  const publicKey = Deno.env.get('EPOINT_PUBLIC_KEY') ?? '';
  const privateKey = Deno.env.get('EPOINT_PRIVATE_KEY') ?? '';
  const appBase = Deno.env.get('APP_BASE_URL') ?? '';

  if (!publicKey || !privateKey || !appBase) {
    return jsonResponse(
      { error: 'E-point not configured (EPOINT_PUBLIC_KEY, EPOINT_PRIVATE_KEY, APP_BASE_URL)' },
      503
    );
  }

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

  const { data: sale, error: sErr } = await supabase
    .from('sales')
    .select('id, total_price, payment_status, source, display_number, customer_user_id, payment_init_token')
    .eq('id', saleId)
    .maybeSingle();

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
  if (sale.customer_user_id && !callerUserId) {
    return jsonResponse({ error: 'Authentication required for this sale' }, 401);
  }
  if (sale.customer_user_id && callerUserId && sale.customer_user_id !== callerUserId) {
    return jsonResponse({ error: 'Not allowed for this sale' }, 403);
  }

  const amount = Number(sale.total_price);
  const base = appBase.replace(/\/$/, '');
  /** `/order` for path-based hosts; set to `/` when APP_BASE_URL is the order subdomain root. */
  const storefrontPath = (Deno.env.get('APP_STOREFRONT_PATH') ?? '/order').trim() || '/order';
  const paidQs = `paid=1&sale=${encodeURIComponent(saleId)}`;
  const errQs = `payment_error=1&sale=${encodeURIComponent(saleId)}`;
  const successUrl =
    storefrontPath === '/' || storefrontPath === ''
      ? `${base}/?${paidQs}`
      : `${base}${storefrontPath.startsWith('/') ? storefrontPath : `/${storefrontPath}`}?${paidQs}`;
  const errorUrl =
    storefrontPath === '/' || storefrontPath === ''
      ? `${base}/?${errQs}`
      : `${base}${storefrontPath.startsWith('/') ? storefrontPath : `/${storefrontPath}`}?${errQs}`;
  const description = `Order ${(sale as { display_number?: string }).display_number ?? saleId}`;

  const externalId = `ep_${saleId}_${Date.now()}`;

  const { data: payRow, error: pErr } = await supabase
    .from('online_payments')
    .insert({
      sale_id: saleId,
      provider: 'epoint',
      external_id: externalId,
      amount,
      currency: 'AZN',
      status: 'pending',
      raw_payload: { created_via: 'epoint-create-payment', saveCard: !!body.saveCard, useWallet: !!body.useWallet },
    })
    .select('id')
    .single();

  if (pErr || !payRow) return jsonResponse({ error: pErr?.message ?? 'Failed to create payment' }, 500);

  const paymentId = payRow.id as string;

  await supabase
    .from('sales')
    .update({ online_payment_id: paymentId })
    .eq('id', saleId);

  try {
    if (body.useWallet) {
      const w = await Epoint.createWalletWidget({
        publicKey,
        privateKey,
        orderId: saleId,
        amount,
        description,
      });
      if (!w.widgetUrl) {
        await supabase.from('online_payments').update({ status: 'failed', error_message: JSON.stringify(w.raw) }).eq('id', paymentId);
        return jsonResponse(
          { error: 'Epoint widget failed', details: w.raw },
          502
        );
      }
      await supabase
        .from('online_payments')
        .update({
          payment_method: 'wallet',
          raw_payload: { created_via: 'epoint-create-payment', useWallet: true, epoint_create: w.raw },
        })
        .eq('id', paymentId);

      return jsonResponse({
        paymentId,
        externalId,
        amount,
        checkoutUrl: w.widgetUrl,
        returnUrl: successUrl,
        type: 'widget',
      });
    }

    if (body.saveCard) {
      const r = await Epoint.registerCardWithPayment({
        publicKey,
        privateKey,
        orderId: saleId,
        amount,
        description,
        successUrl,
        errorUrl,
      });
      if (!r.redirectUrl) {
        await supabase.from('online_payments').update({ status: 'failed', error_message: JSON.stringify(r.raw) }).eq('id', paymentId);
        return jsonResponse({ error: 'Epoint card+pay failed', details: r.raw }, 502);
      }
      await supabase
        .from('online_payments')
        .update({
          epoint_transaction: r.transaction ?? null,
          payment_method: 'card',
          raw_payload: { epoint_create: r.raw },
        })
        .eq('id', paymentId);

      return jsonResponse({
        paymentId,
        externalId,
        amount,
        checkoutUrl: r.redirectUrl,
        returnUrl: successUrl,
        type: 'redirect',
      });
    }

    const result = await Epoint.createPayment({
      publicKey,
      privateKey,
      orderId: saleId,
      amount,
      description,
      language: 'en',
      successUrl,
      errorUrl,
    });

    if (!result.redirectUrl) {
      await supabase
        .from('online_payments')
        .update({ status: 'failed', error_message: result.message ?? JSON.stringify(result.raw) })
        .eq('id', paymentId);
      return jsonResponse({ error: 'Epoint request failed', details: result.raw }, 502);
    }

    await supabase
      .from('online_payments')
      .update({
        epoint_transaction: result.transaction ?? null,
        payment_method: 'card',
        raw_payload: { epoint_create: result.raw },
      })
      .eq('id', paymentId);

    return jsonResponse({
      paymentId,
      externalId,
      amount,
      checkoutUrl: result.redirectUrl,
      returnUrl: successUrl,
      type: 'redirect',
    });
  } catch (e) {
    await supabase
      .from('online_payments')
      .update({
        status: 'failed',
        error_message: e instanceof Error ? e.message : String(e),
      })
      .eq('id', paymentId);
    console.error('epoint-create-payment', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Payment init failed' }, 500);
  }
});
