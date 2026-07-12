import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { PersistDirectOrderLine } from './directOrderValidation.ts';

export type PersistDirectOrderPayload = {
  source: string;
  client_request_id: string;
  client_request_hash: string;
  sale: Record<string, unknown>;
  lines: PersistDirectOrderLine[];
};

export type PersistDirectOrderResult = {
  idempotent: boolean;
  sale_id: string;
  track_token: string | null;
  payment_init_token: string | null;
  display_number: string;
  daily_order_number: number;
  total_price: number;
};

export async function invokePersistDirectOrder(
  supabase: SupabaseClient,
  payload: PersistDirectOrderPayload
): Promise<
  | { ok: true; data: PersistDirectOrderResult }
  | { ok: false; code: string; message: string; status: number }
> {
  const { data, error } = await supabase.rpc('persist_direct_order', { p_payload: payload });

  if (error) {
    const message = error.message ?? 'Persist failed';
    if (message.includes('IDEMPOTENCY_CONFLICT')) {
      return { ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'Request conflict', status: 409 };
    }
    if (message.includes('DIRECT_NUMBER_POOL_EXHAUSTED')) {
      return {
        ok: false,
        code: 'ORDER_NUMBER_POOL_EXHAUSTED',
        message: 'All direct order numbers are currently in use. Please try again shortly.',
        status: 503,
      };
    }
    if (message.includes('CART_') || message.includes('INVALID_') || message.includes('LINES_')) {
      return { ok: false, code: 'INVALID_ORDER', message, status: 400 };
    }
    return { ok: false, code: 'PERSIST_FAILED', message, status: 500 };
  }

  const row = data as Record<string, unknown> | null;
  if (!row || typeof row.sale_id !== 'string') {
    return { ok: false, code: 'PERSIST_INVALID_RESPONSE', message: 'Invalid persist response', status: 500 };
  }

  return {
    ok: true,
    data: {
      idempotent: Boolean(row.idempotent),
      sale_id: row.sale_id,
      track_token: typeof row.track_token === 'string' ? row.track_token : null,
      payment_init_token: typeof row.payment_init_token === 'string' ? row.payment_init_token : null,
      display_number: String(row.display_number ?? ''),
      daily_order_number: Number(row.daily_order_number),
      total_price: Number(row.total_price),
    },
  };
}

export function resolvedLineToPersistLine(
  line:
    | {
        kind: 'product';
        product: { id: string; name: string };
        quantity: number;
        notes: string;
        unitPrice: number;
        modifierRows: Array<{
          groupName: string;
          optionName: string;
          priceAdjustment: number;
        }>;
      }
    | {
        kind: 'combo';
        comboName: string;
        comboId: string;
        quantity: number;
        unitPrice: number;
        lineNotes: string;
        comboSelectionsJson: Record<string, unknown>;
        comboComponentModifiers: Array<{
          comboGroupName: string;
          optionName: string;
          priceAdjustment: number;
        }>;
      }
): PersistDirectOrderLine {
  if (line.kind === 'combo') {
    return {
      product_id: null,
      product_name: line.comboName,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      total_price: line.unitPrice * line.quantity,
      notes: line.lineNotes || null,
      is_combo: true,
      combo_id: line.comboId,
      combo_selections: line.comboSelectionsJson,
      modifiers: line.comboComponentModifiers.map((m) => ({
        modifier_group_name: m.comboGroupName,
        modifier_option_name: m.optionName,
        price_adjustment: m.priceAdjustment,
      })),
    };
  }

  return {
    product_id: line.product.id,
    product_name: line.product.name,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    total_price: line.unitPrice * line.quantity,
    notes: line.notes || null,
    modifiers: line.modifierRows.map((m) => ({
      modifier_group_name: m.groupName,
      modifier_option_name: m.optionName,
      price_adjustment: m.priceAdjustment,
    })),
  };
}
