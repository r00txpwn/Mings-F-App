/**
 * Apply United Payment CheckStatus (or mapped notify status) onto online_payments + sales.
 * Injectable DB — unit-testable without Deno, live United Payment, or staging writes.
 */
import { mapProviderStatus } from './unitedPaymentReturnParse.ts';

export type UnitedPaymentApplyRow = {
  id: string;
  sale_id: string;
  status: string | null;
  external_id: string | null;
  epoint_transaction: string | null;
};

export type UnitedPaymentApplyDb = {
  updateOnlinePayment: (id: string, patch: Record<string, unknown>) => Promise<void>;
  markSalePaid: (saleId: string) => Promise<void>;
  setSaleOrderPendingIfAwaiting: (saleId: string) => Promise<void>;
  markSaleFailed: (saleId: string) => Promise<void>;
};

type SupabaseApplyClient = {
  from: (table: string) => {
    update: (patch: Record<string, unknown>) => {
      eq: (column: string, value: string) => PromiseLike<unknown> & {
        in: (column: string, values: string[]) => PromiseLike<unknown>;
      };
    };
  };
};

export function shouldSkipDuplicateSuccessApply(
  paymentStatus: string | null | undefined,
  providerStatus: string
): boolean {
  return String(paymentStatus ?? '') === 'success' && mapProviderStatus(providerStatus) === 'success';
}

export function unitedPaymentApplyDbFromSupabase(supabase: SupabaseApplyClient): UnitedPaymentApplyDb {
  return {
    async updateOnlinePayment(id, patch) {
      await supabase.from('online_payments').update(patch).eq('id', id);
    },
    async markSalePaid(saleId) {
      await supabase.from('sales').update({ payment_status: 'paid' }).eq('id', saleId);
    },
    async setSaleOrderPendingIfAwaiting(saleId) {
      await supabase
        .from('sales')
        .update({ order_status: 'pending' })
        .eq('id', saleId)
        .in('order_status', ['awaiting_payment', 'pending']);
    },
    async markSaleFailed(saleId) {
      await supabase.from('sales').update({ payment_status: 'failed' }).eq('id', saleId);
    },
  };
}

export async function applyUnitedPaymentStatus(
  db: UnitedPaymentApplyDb,
  payment: UnitedPaymentApplyRow,
  providerStatus: string,
  payload: Record<string, unknown>,
  transactionId: string | null,
  nowIso = new Date().toISOString()
): Promise<'success' | 'failed' | 'pending'> {
  const mapped = mapProviderStatus(providerStatus);
  const patch: Record<string, unknown> = {
    epoint_transaction: transactionId ?? payment.epoint_transaction,
    epoint_status: providerStatus,
    raw_payload: payload,
    updated_at: nowIso,
  };
  if (mapped === 'success') {
    patch.status = 'success';
    patch.paid_at = nowIso;
    patch.error_message = null;
  } else if (mapped === 'failed') {
    patch.status = 'failed';
    patch.error_message = `United Payment status: ${providerStatus}`;
  } else {
    patch.status = 'pending';
  }

  await db.updateOnlinePayment(payment.id, patch);
  if (mapped === 'success') {
    await db.markSalePaid(payment.sale_id);
    await db.setSaleOrderPendingIfAwaiting(payment.sale_id);
  } else if (mapped === 'failed') {
    await db.markSaleFailed(payment.sale_id);
  }
  return mapped;
}

/** Webhook/return notify: skip a second success apply (duplicate webhook or return+webhook race). */
export async function applyUnitedPaymentNotify(
  db: UnitedPaymentApplyDb,
  payment: UnitedPaymentApplyRow,
  providerStatus: string,
  payload: Record<string, unknown>,
  transactionId: string | null,
  nowIso?: string
): Promise<{ mapped: 'success' | 'failed' | 'pending'; skippedDuplicate: boolean }> {
  if (shouldSkipDuplicateSuccessApply(payment.status, providerStatus)) {
    return { mapped: 'success', skippedDuplicate: true };
  }
  const mapped = await applyUnitedPaymentStatus(
    db,
    payment,
    providerStatus,
    payload,
    transactionId,
    nowIso
  );
  return { mapped, skippedDuplicate: false };
}
