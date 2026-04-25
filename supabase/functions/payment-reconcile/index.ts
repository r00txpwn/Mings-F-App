import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import * as Epoint from '../_shared/epoint.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  applyEpointWebhookPaymentRowAndSale,
  insertPaymentReconciliationLog,
  onlinePaymentRowSnapshot,
  salePaymentSnapshot,
  type JsonObject,
  type OnlinePaymentSnapshotFields,
  type PaymentReconciliationLogInsert,
} from '../_shared/paymentReconciliation.ts';

type SaleRow = {
  id: string;
  online_payment_id: string | null;
  payment_status: string | null;
  order_status: string | null;
};

type PayRow = OnlinePaymentSnapshotFields & { created_at?: string | null };

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

function verifyPaymentReconcileSecret(req: Request, expected: string): boolean {
  if (!expected) return false;
  const got = readBearerSecret(req);
  if (got == null) return false;
  return timingSafeEqualString(got, expected);
}

function extractEpointStatus(body: Record<string, unknown>): string | undefined {
  const raw = body.status ?? body.payment_status ?? body.PaymentStatus;
  if (raw == null) return undefined;
  const s = String(raw).trim().toLowerCase();
  return s.length ? s : undefined;
}

/** Match `epoint-webhook` `handleStandardPayment` mapping; missing/empty status → unknown (noop). */
function mapEpointStatus(st: string | undefined): 'success' | 'failed' | 'pending' | 'unknown' {
  if (st === undefined) return 'unknown';
  if (st === 'success') return 'success';
  if (st === 'error' || st === 'failed' || st === 'returned') return 'failed';
  return 'pending';
}

function callbackDataFromGetStatusBody(body: Record<string, unknown>): Record<string, unknown> {
  return { ...body };
}

async function loadSale(supabase: SupabaseClient, saleId: string): Promise<{ ok: true; row: SaleRow } | { ok: false; message: string }> {
  const q = await supabase
    .from('sales')
    .select('id, online_payment_id, payment_status, order_status')
    .eq('id', saleId)
    .maybeSingle();
  if (q.error) return { ok: false, message: q.error.message };
  if (!q.data) return { ok: false, message: 'not_found' };
  const d = q.data as Record<string, unknown>;
  return {
    ok: true,
    row: {
      id: String(d.id),
      online_payment_id: d.online_payment_id != null ? String(d.online_payment_id) : null,
      payment_status: d.payment_status != null ? String(d.payment_status) : null,
      order_status: d.order_status != null ? String(d.order_status) : null,
    },
  };
}

async function loadPaymentRow(
  supabase: SupabaseClient,
  paymentId: string
): Promise<{ ok: true; row: PayRow } | { ok: false; message: string }> {
  const q = await supabase
    .from('online_payments')
    .select(
      'id, sale_id, status, provider, amount, currency, external_id, epoint_transaction, paid_at, updated_at, created_at'
    )
    .eq('id', paymentId)
    .maybeSingle();
  if (q.error) return { ok: false, message: q.error.message };
  if (!q.data) return { ok: false, message: 'not_found' };
  const d = q.data as Record<string, unknown>;
  return {
    ok: true,
    row: {
      id: String(d.id),
      sale_id: String(d.sale_id),
      status: d.status != null ? String(d.status) : null,
      provider: d.provider != null ? String(d.provider) : null,
      amount: d.amount,
      currency: d.currency != null ? String(d.currency) : null,
      external_id: d.external_id != null ? String(d.external_id) : null,
      epoint_transaction: d.epoint_transaction != null ? String(d.epoint_transaction) : null,
      paid_at: d.paid_at != null ? String(d.paid_at) : null,
      updated_at: d.updated_at != null ? String(d.updated_at) : null,
      created_at: d.created_at != null ? String(d.created_at) : null,
    },
  };
}

/**
 * Prefer `sales.online_payment_id` when it matches the latest attempt; otherwise always the latest
 * `online_payments` row for the sale (never an older attempt).
 */
async function resolvePaymentForSale(
  supabase: SupabaseClient,
  sale: SaleRow
): Promise<{ ok: true; payment: PayRow; stale_online_payment_id_ignored: boolean } | { ok: false; message: string }> {
  const latestQ = await supabase
    .from('online_payments')
    .select(
      'id, sale_id, status, provider, amount, currency, external_id, epoint_transaction, paid_at, updated_at, created_at'
    )
    .eq('sale_id', sale.id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestQ.error) return { ok: false, message: latestQ.error.message };
  if (!latestQ.data) return { ok: false, message: 'not_found' };

  const d = latestQ.data as Record<string, unknown>;
  const latest: PayRow = {
    id: String(d.id),
    sale_id: String(d.sale_id),
    status: d.status != null ? String(d.status) : null,
    provider: d.provider != null ? String(d.provider) : null,
    amount: d.amount,
    currency: d.currency != null ? String(d.currency) : null,
    external_id: d.external_id != null ? String(d.external_id) : null,
    epoint_transaction: d.epoint_transaction != null ? String(d.epoint_transaction) : null,
    paid_at: d.paid_at != null ? String(d.paid_at) : null,
    updated_at: d.updated_at != null ? String(d.updated_at) : null,
    created_at: d.created_at != null ? String(d.created_at) : null,
  };

  let stalePointer = false;
  if (sale.online_payment_id) {
    if (sale.online_payment_id !== latest.id) {
      const ptr = await supabase
        .from('online_payments')
        .select('id')
        .eq('id', sale.online_payment_id)
        .eq('sale_id', sale.id)
        .maybeSingle();
      if (ptr.data) stalePointer = true;
    }
  }

  return { ok: true, payment: latest, stale_online_payment_id_ignored: stalePointer };
}

async function writeLog(
  supabase: SupabaseClient,
  row: PaymentReconciliationLogInsert
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  return insertPaymentReconciliationLog(supabase, row);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);

  const secret = (Deno.env.get('PAYMENT_RECONCILE_SECRET') ?? '').trim();
  if (!verifyPaymentReconcileSecret(req, secret)) {
    return jsonResponse({ ok: false, error: 'AUTH_INVALID' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: 'INVALID_JSON' }, 400);
  }

  const saleIdRaw = body.sale_id;
  const payIdRaw = body.online_payment_id;
  const hasSale = saleIdRaw != null && String(saleIdRaw).length > 0;
  const hasPay = payIdRaw != null && String(payIdRaw).length > 0;
  if (hasSale === hasPay) {
    return jsonResponse({ ok: false, error: 'VALIDATION', detail: 'send exactly one of sale_id or online_payment_id' }, 400);
  }

  const publicKey = (Deno.env.get('EPOINT_PUBLIC_KEY') ?? '').trim();
  const privateKey = (Deno.env.get('EPOINT_PRIVATE_KEY') ?? '').trim();
  if (!publicKey || !privateKey) {
    return jsonResponse({ ok: false, error: 'MISCONFIGURED', detail: 'EPOINT_PUBLIC_KEY and EPOINT_PRIVATE_KEY required' }, 503);
  }

  if (hasPay) {
    return reconcileByPayment(supabase, String(payIdRaw), publicKey, privateKey);
  }
  return reconcileBySale(supabase, String(saleIdRaw), publicKey, privateKey);
});

async function reconcileByPayment(
  supabase: SupabaseClient,
  onlinePaymentId: string,
  publicKey: string,
  privateKey: string
): Promise<Response> {
  const payRes = await loadPaymentRow(supabase, onlinePaymentId);
  if (!payRes.ok) {
    if (payRes.message === 'not_found') return jsonResponse({ ok: false, error: 'NOT_FOUND' }, 404);
    return jsonResponse({ ok: false, error: 'DB_ERROR', detail: payRes.message }, 500);
  }

  const saleRes = await loadSale(supabase, payRes.row.sale_id);
  if (!saleRes.ok) {
    await tryLogWithoutSaleFk(supabase, payRes.row, onlinePaymentId, saleRes.message);
    if (saleRes.message === 'not_found') return jsonResponse({ ok: false, error: 'NOT_FOUND' }, 404);
    return jsonResponse({ ok: false, error: 'DB_ERROR', detail: saleRes.message }, 500);
  }

  return runReconcileCore(
    supabase,
    payRes.row,
    saleRes.row,
    'manual_edge_by_payment',
    publicKey,
    privateKey,
    null
  );
}

/** When sale load fails we still have payment.sale_id for logging — only if sale exists for FK. */
async function tryLogWithoutSaleFk(
  supabase: SupabaseClient,
  pay: PayRow,
  onlinePaymentId: string,
  msg: string
): Promise<void> {
  if (msg === 'not_found') return;
  const ins = await writeLog(supabase, {
    sale_id: pay.sale_id,
    online_payment_id: onlinePaymentId,
    provider: 'epoint',
    reconcile_trigger: 'manual_edge_by_payment',
    candidate_reason: 'load_sale_failed',
    action: 'db_error_select_sale',
    before_snapshot: { online_payment: onlinePaymentRowSnapshot(pay) },
    after_snapshot: {},
    error_message: msg,
  });
  if (!ins.ok) console.error('payment-reconcile: audit log insert failed', ins.message);
}

async function reconcileBySale(
  supabase: SupabaseClient,
  saleId: string,
  publicKey: string,
  privateKey: string
): Promise<Response> {
  const saleRes = await loadSale(supabase, saleId);
  if (!saleRes.ok) {
    if (saleRes.message === 'not_found') return jsonResponse({ ok: false, error: 'NOT_FOUND' }, 404);
    return jsonResponse({ ok: false, error: 'DB_ERROR', detail: saleRes.message }, 500);
  }

  const pick = await resolvePaymentForSale(supabase, saleRes.row);
  if (!pick.ok) {
    const logIns = await writeLog(supabase, {
      sale_id: saleId,
      provider: 'epoint',
      reconcile_trigger: 'manual_edge_by_sale',
      candidate_reason: pick.message === 'not_found' ? 'no_online_payment_for_sale' : 'resolve_payment_row',
      action: pick.message === 'not_found' ? 'not_found' : 'db_error_select_payment',
      before_snapshot: { sale: salePaymentSnapshot(saleRes.row) },
      after_snapshot: {},
      error_message: pick.message === 'not_found' ? null : pick.message,
    });
    if (!logIns.ok) console.error('payment-reconcile: audit log insert failed', logIns.message);
    return jsonResponse({ ok: false, error: pick.message === 'not_found' ? 'NOT_FOUND' : 'DB_ERROR', detail: pick.message }, pick.message === 'not_found' ? 404 : 500);
  }

  const candidateReason = pick.stale_online_payment_id_ignored
    ? 'used_latest_row_newer_than_sales_online_payment_id'
    : saleRes.row.online_payment_id && saleRes.row.online_payment_id === pick.payment.id
      ? 'used_sales_online_payment_id_matches_latest'
      : 'used_latest_online_payment';

  return runReconcileCore(
    supabase,
    pick.payment,
    saleRes.row,
    'manual_edge_by_sale',
    publicKey,
    privateKey,
    candidateReason
  );
}

async function runReconcileCore(
  supabase: SupabaseClient,
  payment: PayRow,
  sale: SaleRow,
  reconcileTrigger: 'manual_edge_by_sale' | 'manual_edge_by_payment',
  publicKey: string,
  privateKey: string,
  candidateReasonExtra: string | null
): Promise<Response> {
  const provider = (payment.provider ?? 'epoint').toLowerCase();
  const beforePay = onlinePaymentRowSnapshot(payment);
  const beforeSale = salePaymentSnapshot(sale);

  const baseLog = (): Omit<PaymentReconciliationLogInsert, 'action' | 'after_snapshot' | 'provider_response' | 'error_message' | 'candidate_reason'> => ({
    sale_id: sale.id,
    online_payment_id: payment.id,
    provider,
    reconcile_trigger: reconcileTrigger,
    before_snapshot: { online_payment: beforePay, sale: beforeSale },
  });

  if (provider === 'upay') {
    const logRow: PaymentReconciliationLogInsert = {
      ...baseLog(),
      candidate_reason: candidateReasonExtra ?? 'provider_upay',
      action: 'skipped_upay_not_implemented',
      after_snapshot: { online_payment: beforePay, sale: beforeSale },
      provider_response: null,
      error_message: null,
    };
    const ins = await writeLog(supabase, logRow);
    if (!ins.ok) console.error('payment-reconcile: audit log insert failed', ins.message);
    return jsonResponse({
      ok: false,
      outcome: 'skipped',
      reason: 'UPAY_NOT_IMPLEMENTED',
      log_id: ins.ok ? ins.id : undefined,
    });
  }

  if (provider !== 'epoint') {
    const logRow: PaymentReconciliationLogInsert = {
      ...baseLog(),
      candidate_reason: candidateReasonExtra ?? `provider_${provider}`,
      action: 'skipped_unknown_provider',
      after_snapshot: { online_payment: beforePay, sale: beforeSale },
      provider_response: null,
      error_message: null,
    };
    const ins = await writeLog(supabase, logRow);
    if (!ins.ok) console.error('payment-reconcile: audit log insert failed', ins.message);
    return jsonResponse({
      ok: false,
      outcome: 'skipped',
      reason: 'UNKNOWN_PROVIDER',
      provider,
      log_id: ins.ok ? ins.id : undefined,
    });
  }

  const orderId = sale.id;
  const epointRes = await Epoint.checkPaymentStatusDetailed({
    publicKey,
    privateKey,
    transaction: payment.epoint_transaction ?? undefined,
    orderId: payment.epoint_transaction ? undefined : orderId,
  });

  if (!epointRes.ok) {
    const logRow: PaymentReconciliationLogInsert = {
      ...baseLog(),
      candidate_reason: candidateReasonExtra ?? 'epoint_get_status',
      action: 'provider_status_query_failed',
      after_snapshot: { online_payment: beforePay, sale: beforeSale },
      provider_response: { kind: epointRes.kind, httpStatus: epointRes.httpStatus ?? null, message: epointRes.message },
      error_message: epointRes.message,
    };
    const ins = await writeLog(supabase, logRow);
    if (!ins.ok) console.error('payment-reconcile: audit log insert failed', ins.message);
    return jsonResponse({
      ok: false,
      outcome: 'provider_error',
      error: 'PROVIDER_ERROR',
      detail: epointRes.message,
      log_id: ins.ok ? ins.id : undefined,
    });
  }

  const body = epointRes.body;
  const stRaw = extractEpointStatus(body);
  const mapped = mapEpointStatus(stRaw);

  if (mapped === 'unknown') {
    const logRow: PaymentReconciliationLogInsert = {
      ...baseLog(),
      candidate_reason: candidateReasonExtra ?? 'missing_or_empty_epoint_status',
      action: 'noop_unknown_provider_status',
      after_snapshot: { online_payment: beforePay, sale: beforeSale },
      provider_response: body as JsonObject,
      error_message: null,
    };
    const ins = await writeLog(supabase, logRow);
    if (!ins.ok) console.error('payment-reconcile: audit log insert failed', ins.message);
    return jsonResponse({
      ok: true,
      outcome: 'noop',
      suboutcome: 'unknown_status',
      log_id: ins.ok ? ins.id : undefined,
    });
  }

  const success = mapped === 'success';
  const failed = mapped === 'failed';
  const pending = mapped === 'pending';

  if (payment.status === 'success' && success) {
    const logRow: PaymentReconciliationLogInsert = {
      ...baseLog(),
      candidate_reason: candidateReasonExtra ?? 'already_success',
      action: 'noop_already_success',
      after_snapshot: { online_payment: beforePay, sale: beforeSale },
      provider_response: body as JsonObject,
      error_message: null,
    };
    const ins = await writeLog(supabase, logRow);
    if (!ins.ok) console.error('payment-reconcile: audit log insert failed', ins.message);
    return jsonResponse({
      ok: true,
      outcome: 'noop',
      suboutcome: 'already_success',
      log_id: ins.ok ? ins.id : undefined,
    });
  }

  if (payment.status === 'success' && failed) {
    const logRow: PaymentReconciliationLogInsert = {
      ...baseLog(),
      candidate_reason: candidateReasonExtra ?? 'db_payment_success_provider_failed',
      action: 'noop_db_payment_success_provider_disagrees',
      after_snapshot: { online_payment: beforePay, sale: beforeSale },
      provider_response: body as JsonObject,
      error_message: null,
    };
    const ins = await writeLog(supabase, logRow);
    if (!ins.ok) console.error('payment-reconcile: audit log insert failed', ins.message);
    return jsonResponse({
      ok: true,
      outcome: 'noop',
      suboutcome: 'provider_failed_db_success_no_mutation',
      log_id: ins.ok ? ins.id : undefined,
    });
  }

  if (payment.status === 'success' && pending) {
    const logRow: PaymentReconciliationLogInsert = {
      ...baseLog(),
      candidate_reason: candidateReasonExtra ?? 'db_payment_success_provider_pending',
      action: 'noop_no_downgrade_from_success_row',
      after_snapshot: { online_payment: beforePay, sale: beforeSale },
      provider_response: body as JsonObject,
      error_message: null,
    };
    const ins = await writeLog(supabase, logRow);
    if (!ins.ok) console.error('payment-reconcile: audit log insert failed', ins.message);
    return jsonResponse({
      ok: true,
      outcome: 'noop',
      suboutcome: 'no_downgrade_online_payment_success',
      log_id: ins.ok ? ins.id : undefined,
    });
  }

  if (sale.payment_status === 'paid' && failed) {
    const logRow: PaymentReconciliationLogInsert = {
      ...baseLog(),
      candidate_reason: candidateReasonExtra ?? 'sale_already_paid_provider_failed',
      action: 'noop_sale_paid_no_failed_apply',
      after_snapshot: { online_payment: beforePay, sale: beforeSale },
      provider_response: body as JsonObject,
      error_message: null,
    };
    const ins = await writeLog(supabase, logRow);
    if (!ins.ok) console.error('payment-reconcile: audit log insert failed', ins.message);
    return jsonResponse({
      ok: true,
      outcome: 'noop',
      suboutcome: 'sale_paid_skip_failed_apply',
      log_id: ins.ok ? ins.id : undefined,
    });
  }

  if (sale.payment_status === 'paid' && pending) {
    const logRow: PaymentReconciliationLogInsert = {
      ...baseLog(),
      candidate_reason: candidateReasonExtra ?? 'sale_already_paid_provider_pending',
      action: 'noop_sale_paid_no_pending_downgrade',
      after_snapshot: { online_payment: beforePay, sale: beforeSale },
      provider_response: body as JsonObject,
      error_message: null,
    };
    const ins = await writeLog(supabase, logRow);
    if (!ins.ok) console.error('payment-reconcile: audit log insert failed', ins.message);
    return jsonResponse({
      ok: true,
      outcome: 'noop',
      suboutcome: 'sale_paid_skip_pending_apply',
      log_id: ins.ok ? ins.id : undefined,
    });
  }

  const callbackData = callbackDataFromGetStatusBody(body);
  const applyRes = await applyEpointWebhookPaymentRowAndSale(
    supabase,
    payment.id,
    sale.id,
    callbackData,
    success,
    failed
  );

  if (!applyRes.ok) {
    const logRow: PaymentReconciliationLogInsert = {
      ...baseLog(),
      candidate_reason: candidateReasonExtra ?? 'apply_after_provider',
      action: 'apply_failed_supabase',
      after_snapshot: { online_payment: beforePay, sale: beforeSale },
      provider_response: body as JsonObject,
      error_message: `${applyRes.step}: ${applyRes.message}`,
    };
    const ins = await writeLog(supabase, logRow);
    if (!ins.ok) console.error('payment-reconcile: audit log insert failed', ins.message);
    return jsonResponse({
      ok: false,
      outcome: 'db_error',
      error: 'APPLY_FAILED',
      detail: applyRes.message,
      step: applyRes.step,
      log_id: ins.ok ? ins.id : undefined,
    }, 500);
  }

  const payAfter = await loadPaymentRow(supabase, payment.id);
  const saleAfter = await loadSale(supabase, sale.id);
  const afterPay = payAfter.ok ? onlinePaymentRowSnapshot(payAfter.row) : beforePay;
  const afterSale = saleAfter.ok ? salePaymentSnapshot(saleAfter.row) : beforeSale;

  const action =
    success ? 'apply_epoint_success' : failed ? 'apply_epoint_failed' : 'apply_epoint_pending_sync';

  const logRow: PaymentReconciliationLogInsert = {
    ...baseLog(),
    candidate_reason: candidateReasonExtra ?? undefined,
    action,
    after_snapshot: { online_payment: afterPay, sale: afterSale },
    provider_response: body as JsonObject,
    error_message: null,
  };
  const ins = await writeLog(supabase, logRow);
  if (!ins.ok) {
    console.error('payment-reconcile: audit log insert failed after successful apply', ins.message);
    return jsonResponse({
      ok: true,
      outcome: success ? 'applied_success' : failed ? 'applied_failed' : 'applied_pending',
      warning: 'AUDIT_LOG_INSERT_FAILED',
      audit_error: ins.message,
    });
  }

  return jsonResponse({
    ok: true,
    outcome: success ? 'applied_success' : failed ? 'applied_failed' : 'applied_pending',
    log_id: ins.id,
  });
}
