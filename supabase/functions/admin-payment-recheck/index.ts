/**
 * Staff cockpit bridge: re-check online payment status with the provider.
 * Validates staff JWT (admin/manager), then calls secret-gated reconcile functions.
 */
import {
  corsHeaders,
  jsonResponse,
  requireStaffAuth,
  writeAdminAudit,
} from '../_shared/staffAuth.ts';

type PaymentRow = {
  id: string;
  sale_id: string;
  provider: string | null;
};

function normalizeProvider(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase();
}

function isUnitedPaymentProvider(provider: string): boolean {
  return provider === 'united_payment' || provider === 'upay' || provider === 'unitedpayment';
}

async function invokeDownstream(
  functionName: string,
  body: Record<string, unknown>,
  secret: string
): Promise<{ status: number; json: Record<string, unknown> }> {
  const base = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '');
  const res = await fetch(`${base}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
  });
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    json = {};
  }
  return { status: res.status, json };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  const auth = await requireStaffAuth(req, { minRole: ['admin', 'manager'] });
  if (auth instanceof Response) return auth;

  const { user, role, supabaseAdmin } = auth;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, 400);
  }

  const onlinePaymentId = body.online_payment_id != null ? String(body.online_payment_id).trim() : '';
  if (!onlinePaymentId) {
    return jsonResponse(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'online_payment_id is required' } },
      400
    );
  }

  const secret = (Deno.env.get('PAYMENT_RECONCILE_SECRET') ?? '').trim();
  if (!secret) {
    return jsonResponse(
      { ok: false, error: { code: 'MISCONFIGURED', message: 'PAYMENT_RECONCILE_SECRET is not set' } },
      503
    );
  }

  const { data: paymentRow, error: loadError } = await supabaseAdmin
    .from('online_payments')
    .select('id, sale_id, provider')
    .eq('id', onlinePaymentId)
    .maybeSingle();

  if (loadError) {
    return jsonResponse(
      { ok: false, error: { code: 'DB_ERROR', message: loadError.message } },
      500
    );
  }
  if (!paymentRow) {
    return jsonResponse({ ok: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } }, 404);
  }

  const payment = paymentRow as PaymentRow;
  const provider = normalizeProvider(payment.provider);

  let downstreamName: string;
  let downstreamBody: Record<string, unknown>;

  if (isUnitedPaymentProvider(provider)) {
    downstreamName = 'united-payment-status-check';
    downstreamBody = { online_payment_id: payment.id };
  } else if (provider === 'epoint') {
    downstreamName = 'payment-reconcile';
    downstreamBody = { online_payment_id: payment.id };
  } else {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'UNSUPPORTED_PROVIDER',
          message: `Provider "${payment.provider ?? 'unknown'}" is not supported for re-check`,
        },
      },
      400
    );
  }

  const downstream = await invokeDownstream(downstreamName, downstreamBody, secret);

  await writeAdminAudit(supabaseAdmin, {
    actorId: user.id,
    actorRole: role,
    action: 'payment_recheck',
    resourceTable: 'online_payments',
    resourceId: payment.id,
    payload: {
      provider: payment.provider,
      sale_id: payment.sale_id,
      downstream: downstreamName,
      downstream_status: downstream.status,
      downstream_result: downstream.json,
    },
  });

  const downstreamOk = downstream.status >= 200 && downstream.status < 300 && downstream.json.ok !== false;

  return jsonResponse(
    {
      ok: downstreamOk,
      provider: payment.provider,
      downstream: downstreamName,
      result: downstream.json,
      error: downstreamOk
        ? undefined
        : {
            code: String(downstream.json.error ?? 'PROVIDER_RECHECK_FAILED'),
            message:
              typeof downstream.json.detail === 'string'
                ? downstream.json.detail
                : typeof downstream.json.error === 'string'
                  ? downstream.json.error
                  : 'Provider re-check failed',
          },
    },
    downstreamOk ? 200 : downstream.status >= 400 ? downstream.status : 502
  );
});
