/** Mirror of src/lib/salesMutationPolicy.ts for Edge Functions. Keep in sync. */

export type SalesMutationRole = 'staff' | 'manager' | 'admin';
export type SalesMutationOp = 'insert' | 'update' | 'delete' | 'upsert';

export const KITCHEN_ORDER_SOURCES = new Set([
  'kiosk',
  'online_delivery',
  'online_takeaway',
  'pos_eat_in',
  'pos_takeaway',
  'pos_delivery',
]);

export const MANUAL_SALE_SOURCE = 'manual';

export const STAFF_WORKFLOW_UPDATE_FIELDS = new Set([
  'order_status',
  'prep_started_at',
  'estimated_ready_at',
  'ready_at',
  'dispatched_at',
  'completed_at',
  'cancellation_reason',
  'reminder_at',
  'payment_status',
  'paid_at',
  'payment_method',
]);

export const MANUAL_SALE_MUTABLE_FIELDS = new Set([
  'total_price',
  'quantity',
  'unit_price',
  'sales_channel_id',
  'notes',
  'sale_date',
]);

const CARD_ONLINE_METHODS = new Set(['card', 'card_online', 'epoint']);

export type ExistingSaleRow = {
  id?: string;
  source?: string | null;
  online_payment_method?: string | null;
  payment_method?: string | null;
};

function isKitchenSource(source: string | null | undefined): boolean {
  return KITCHEN_ORDER_SOURCES.has(String(source ?? '').trim());
}

function isManualSource(source: string | null | undefined): boolean {
  const s = String(source ?? MANUAL_SALE_SOURCE).trim();
  return s === MANUAL_SALE_SOURCE || s === '';
}

function payloadKeys(payload: Record<string, unknown> | null | undefined): string[] {
  if (!payload || typeof payload !== 'object') return [];
  return Object.keys(payload);
}

function pickFields(payload: Record<string, unknown>, allowed: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in payload) out[key] = payload[key];
  }
  return out;
}

function isCardSale(row: ExistingSaleRow): boolean {
  const online = String(row.online_payment_method ?? '').trim().toLowerCase();
  const method = String(row.payment_method ?? '').trim().toLowerCase();
  return CARD_ONLINE_METHODS.has(online) || CARD_ONLINE_METHODS.has(method);
}

function validateMarkPaidPatch(
  existing: ExistingSaleRow,
  payload: Record<string, unknown>
): { ok: true } | { ok: false; message: string } {
  const keys = payloadKeys(payload);
  const nonMarkPaid = keys.filter(
    (k) => !['payment_status', 'paid_at', 'payment_method'].includes(k)
  );
  if (nonMarkPaid.length > 0) {
    return { ok: false, message: 'Only workflow fields may be updated on kitchen orders' };
  }

  if ('payment_status' in payload && payload.payment_status !== 'paid') {
    return { ok: false, message: 'payment_status may only be set to paid for mark-paid actions' };
  }

  if (payload.payment_status === 'paid' && typeof payload.paid_at !== 'string') {
    return { ok: false, message: 'Mark paid requires paid_at' };
  }

  if ('payment_method' in payload) {
    const method = String(payload.payment_method ?? '').trim().toLowerCase();
    if (method !== 'cash') {
      return { ok: false, message: 'Staff may only mark cash payment on kitchen orders' };
    }
    if (isCardSale(existing)) {
      return { ok: false, message: 'Card orders cannot be relabeled as cash' };
    }
  }

  return { ok: true };
}

function validateKitchenWorkflowUpdate(
  existing: ExistingSaleRow,
  payload: Record<string, unknown>
): { ok: true; sanitized: Record<string, unknown> } | { ok: false; message: string } {
  const keys = payloadKeys(payload);
  const disallowed = keys.filter((k) => !STAFF_WORKFLOW_UPDATE_FIELDS.has(k));
  if (disallowed.length > 0) {
    return { ok: false, message: `Forbidden fields on kitchen order: ${disallowed.join(', ')}` };
  }

  const markPaidOnly = keys.every((k) => ['payment_status', 'paid_at', 'payment_method'].includes(k));
  if (markPaidOnly && 'payment_status' in payload) {
    const markPaid = validateMarkPaidPatch(existing, payload);
    if (!markPaid.ok) return markPaid;
  }

  return { ok: true, sanitized: pickFields(payload, STAFF_WORKFLOW_UPDATE_FIELDS) };
}

export function assertSalesMutationAllowed(
  role: SalesMutationRole,
  operation: SalesMutationOp,
  existing: ExistingSaleRow | null | undefined,
  payload?: Record<string, unknown> | null
): { ok: true; sanitizedPayload?: Record<string, unknown> } | { ok: false; message: string } {
  if (operation === 'upsert') {
    return { ok: false, message: 'Sales upsert is not allowed' };
  }

  if (role === 'staff') {
    if (operation !== 'update') {
      return { ok: false, message: 'Staff may only update existing kitchen orders' };
    }
    if (!existing?.id) {
      return { ok: false, message: 'Sale not found' };
    }
    if (!isKitchenSource(existing.source)) {
      return { ok: false, message: 'Staff may only update kitchen orders' };
    }
    if (!payload || Array.isArray(payload)) {
      return { ok: false, message: 'update requires payload object' };
    }
    const workflow = validateKitchenWorkflowUpdate(existing, payload);
    if (!workflow.ok) return workflow;
    return { ok: true, sanitizedPayload: workflow.sanitized };
  }

  if (operation === 'insert') {
    if (!payload || Array.isArray(payload)) {
      return { ok: false, message: 'insert requires payload object' };
    }
    const source = typeof payload.source === 'string' ? payload.source.trim() : MANUAL_SALE_SOURCE;
    if (source !== MANUAL_SALE_SOURCE && source !== '') {
      return { ok: false, message: 'Only manual partner sales may be inserted' };
    }
    return {
      ok: true,
      sanitizedPayload: {
        ...pickFields(payload, MANUAL_SALE_MUTABLE_FIELDS),
        source: MANUAL_SALE_SOURCE,
      },
    };
  }

  if (operation === 'delete') {
    if (!existing?.id) {
      return { ok: false, message: 'Sale not found' };
    }
    if (!isManualSource(existing.source)) {
      return { ok: false, message: 'Only manual partner sales may be deleted' };
    }
    return { ok: true };
  }

  if (operation === 'update') {
    if (!existing?.id) {
      return { ok: false, message: 'Sale not found' };
    }
    if (!payload || Array.isArray(payload)) {
      return { ok: false, message: 'update requires payload object' };
    }

    if (isManualSource(existing.source)) {
      const disallowed = payloadKeys(payload).filter((k) => !MANUAL_SALE_MUTABLE_FIELDS.has(k));
      if (disallowed.length > 0) {
        return { ok: false, message: `Forbidden fields on manual sale update: ${disallowed.join(', ')}` };
      }
      return { ok: true, sanitizedPayload: pickFields(payload, MANUAL_SALE_MUTABLE_FIELDS) };
    }

    if (isKitchenSource(existing.source)) {
      const workflow = validateKitchenWorkflowUpdate(existing, payload);
      if (!workflow.ok) return workflow;
      return { ok: true, sanitizedPayload: workflow.sanitized };
    }

    return { ok: false, message: 'This sale type cannot be updated through admin-api' };
  }

  return { ok: false, message: 'Invalid operation' };
}
