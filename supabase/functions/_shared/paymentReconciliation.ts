import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

/** Row shape accepted by Supabase `.insert()` for `payment_reconciliation_log`. */
export type PaymentReconciliationLogInsert = {
  sale_id: string;
  online_payment_id?: string | null;
  /** DB column is free text; use `online_payments.provider` or `epoint` / `upay` when known. */
  provider: string;
  reconcile_trigger: string;
  candidate_reason?: string | null;
  action: string;
  before_snapshot: JsonObject;
  after_snapshot: JsonObject;
  provider_response?: JsonObject | null;
  error_message?: string | null;
};

export type JsonObject = Record<string, unknown>;

/** Providers that participate in online payment reconciliation. */
export type PaymentReconciliationProvider = 'epoint' | 'upay';

// TODO(UPAY): Add UPay remote status fetch + mapping when the UPay adapter ships
// (no API calls here — this file stays provider-agnostic except EPoint apply semantics below).

/** Narrow payment row fields useful for reconciliation snapshots. */
export type OnlinePaymentSnapshotFields = {
  id: string;
  sale_id: string;
  status: string | null;
  provider?: string | null;
  amount?: unknown;
  currency?: string | null;
  external_id?: string | null;
  epoint_transaction?: string | null;
  paid_at?: string | null;
  updated_at?: string | null;
};

export function onlinePaymentRowSnapshot(row: OnlinePaymentSnapshotFields): JsonObject {
  return {
    id: row.id,
    sale_id: row.sale_id,
    status: row.status,
    provider: row.provider ?? null,
    amount: row.amount ?? null,
    currency: row.currency ?? null,
    external_id: row.external_id ?? null,
    epoint_transaction: row.epoint_transaction ?? null,
    paid_at: row.paid_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

export type SalePaymentSnapshotFields = {
  id: string;
  payment_status: string | null;
  order_status: string | null;
};

export function salePaymentSnapshot(row: SalePaymentSnapshotFields): JsonObject {
  return {
    id: row.id,
    payment_status: row.payment_status,
    order_status: row.order_status,
  };
}

function str(cb: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = cb[k];
    if (v != null && String(v).length > 0) return String(v);
  }
  return undefined;
}

export type ApplyEpointPaymentResult =
  | { ok: true }
  | { ok: false; step: string; message: string };

/**
 * Applies the same `online_payments` + `sales` updates as the historical EPoint signed-callback
 * webhook path (success / failed / pending + order_status guard). Intended for `epoint-webhook`
 * and `payment-reconcile`. Checks Supabase errors on every write.
 */
export async function applyEpointWebhookPaymentRowAndSale(
  supabase: SupabaseClient,
  payId: string,
  saleId: string,
  callbackData: Record<string, unknown>,
  success: boolean,
  failed: boolean
): Promise<ApplyEpointPaymentResult> {
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

  const upPay = await supabase.from('online_payments').update(patch).eq('id', payId);
  if (upPay.error) {
    return { ok: false, step: 'online_payments_update', message: upPay.error.message };
  }

  if (success) {
    const upSalePaid = await supabase.from('sales').update({ payment_status: 'paid' }).eq('id', saleId);
    if (upSalePaid.error) {
      return { ok: false, step: 'sales_payment_status_paid', message: upSalePaid.error.message };
    }
    const upOrder = await supabase
      .from('sales')
      .update({ order_status: 'pending' })
      .eq('id', saleId)
      .eq('order_status', 'awaiting_payment');
    if (upOrder.error) {
      return { ok: false, step: 'sales_order_status_pending', message: upOrder.error.message };
    }
  } else if (failed) {
    const upSaleFailed = await supabase.from('sales').update({ payment_status: 'failed' }).eq('id', saleId);
    if (upSaleFailed.error) {
      return { ok: false, step: 'sales_payment_status_failed', message: upSaleFailed.error.message };
    }
  }

  return { ok: true };
}

export async function insertPaymentReconciliationLog(
  supabase: SupabaseClient,
  row: PaymentReconciliationLogInsert
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const ins = await supabase
    .from('payment_reconciliation_log')
    .insert(row as never)
    .select('id')
    .single();
  if (ins.error || !ins.data) {
    return { ok: false, message: ins.error?.message ?? 'insert returned no row' };
  }
  const id = (ins.data as { id: string }).id;
  return { ok: true, id };
}
