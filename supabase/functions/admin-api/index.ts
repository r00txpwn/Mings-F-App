import {
  corsHeaders,
  jsonResponse,
  requireStaffAuth,
  writeAdminAudit,
  type StaffRole,
} from '../_shared/staffAuth.ts';
import { assertSalesChannelMutationAllowed } from '../_shared/salesChannelPolicy.ts';
import { assertSalesMutationAllowed } from '../_shared/salesMutationPolicy.ts';

type MutationOp = 'insert' | 'update' | 'delete' | 'upsert';

interface MutateBody {
  table: string;
  operation: MutationOp;
  payload?: Record<string, unknown> | Record<string, unknown>[];
  match?: Record<string, unknown>;
  /** Required for update/delete */
  id?: string;
}

// Cockpit is administration-only: `staff`-role users are blocked from the
// cockpit UI and from admin CRUD here. `sales` is the deliberate exception —
// Order Manager (a floor surface) updates order status as `staff`.
const TABLE_MIN_ROLE: Record<string, StaffRole[]> = {
  products: ['admin', 'manager'],
  purchases: ['admin', 'manager'],
  operational_expenses: ['admin', 'manager'],
  master_categories: ['admin', 'manager'],
  expense_items: ['admin', 'manager'],
  suppliers: ['admin', 'manager'],
  supplier_account_payments: ['admin', 'manager'],
  supplier_debts: ['admin', 'manager'],
  liabilities: ['admin', 'manager'],
  liability_payments: ['admin', 'manager'],
  bank_withdrawals: ['admin', 'manager'],
  cash_movements: ['admin', 'manager'],
  finance_accounts: ['admin', 'manager'],
  finance_withdrawal_fee_settings: ['admin'],
  account_transfers: ['admin', 'manager'],
  sales_channels: ['admin', 'manager'],
  platform_payouts: ['admin', 'manager'],
  delivery_zones: ['admin', 'manager'],
  online_settings: ['admin', 'manager'],
  sales: ['admin', 'manager', 'staff'],
  combo_deals: ['admin', 'manager'],
  combo_groups: ['admin', 'manager'],
  combo_group_items: ['admin', 'manager'],
  product_modifier_groups: ['admin', 'manager'],
  modifier_groups: ['admin', 'manager'],
  modifier_options: ['admin', 'manager'],
  transactions: ['admin', 'manager'],
  employees: ['admin', 'manager'],
  salary_payments: ['admin', 'manager'],
  employee_day_marks: ['admin', 'manager'],
};

const ALLOWED_TABLES = new Set(Object.keys(TABLE_MIN_ROLE));

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*\/admin-api\/?/, '').replace(/^\//, '');

  if (path !== 'mutate' && path !== '') {
    return jsonResponse({ ok: false, error: { code: 'NOT_FOUND', message: 'Unknown route' } }, 404);
  }

  let body: MutateBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, 400);
  }

  const { table, operation, payload, match, id } = body;
  if (!table || !operation || !ALLOWED_TABLES.has(table)) {
    return jsonResponse({ ok: false, error: { code: 'FORBIDDEN', message: 'Table not allowed' } }, 403);
  }

  const minRole = TABLE_MIN_ROLE[table] ?? ['admin'];
  const auth = await requireStaffAuth(req, { minRole });
  if (auth instanceof Response) return auth;

  const { user, role, supabaseAdmin } = auth;
  const q = supabaseAdmin.from(table);

  async function loadSalesChannel(channelId: string): Promise<{ id: string; name: string } | null> {
    const { data } = await supabaseAdmin
      .from('sales_channels')
      .select('id, name')
      .eq('id', channelId)
      .maybeSingle();
    if (!data || typeof data.id !== 'string' || typeof data.name !== 'string') return null;
    return { id: data.id, name: data.name };
  }

  let result;
  let resourceId: string | null = id ?? null;
  let effectivePayload = payload;

  if (table === 'sales') {
    if (operation === 'upsert') {
      return jsonResponse(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Sales upsert is not allowed' } },
        403
      );
    }

    if (operation === 'update' || operation === 'delete') {
      if (!id) {
        return jsonResponse(
          { ok: false, error: { code: 'BAD_REQUEST', message: `${operation} requires id for sales` } },
          400
        );
      }
      if (match) {
        return jsonResponse(
          { ok: false, error: { code: 'BAD_REQUEST', message: 'sales mutations must use id, not match' } },
          400
        );
      }

      const { data: existingSale, error: loadErr } = await supabaseAdmin
        .from('sales')
        .select('id, source, online_payment_method, payment_method')
        .eq('id', id)
        .maybeSingle();

      if (loadErr) {
        return jsonResponse(
          { ok: false, error: { code: 'DB_ERROR', message: loadErr.message } },
          400
        );
      }
      if (!existingSale) {
        return jsonResponse(
          { ok: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } },
          404
        );
      }

      const guard = assertSalesMutationAllowed(
        role,
        operation,
        existingSale as Record<string, unknown>,
        payload && !Array.isArray(payload) ? payload : null
      );
      if (!guard.ok) {
        return jsonResponse(
          { ok: false, error: { code: 'FORBIDDEN', message: guard.message } },
          403
        );
      }
      if (operation === 'update') {
        effectivePayload = guard.sanitizedPayload ?? {};
      }
    } else if (operation === 'insert') {
      if (!payload || Array.isArray(payload)) {
        return jsonResponse(
          { ok: false, error: { code: 'BAD_REQUEST', message: 'insert requires payload object' } },
          400
        );
      }
      const guard = assertSalesMutationAllowed(role, operation, null, payload);
      if (!guard.ok) {
        return jsonResponse(
          { ok: false, error: { code: 'FORBIDDEN', message: guard.message } },
          403
        );
      }
      effectivePayload = {
        ...(guard.sanitizedPayload ?? {}),
        created_by: user.id,
      };
    }
  }

  if (table === 'sales_channels') {
    if (operation === 'insert' || operation === 'upsert') {
      const payloadObj = payload && !Array.isArray(payload) ? payload : null;
      const guard = assertSalesChannelMutationAllowed(operation, null, payloadObj);
      if (!guard.ok) {
        return jsonResponse(
          { ok: false, error: { code: 'SYSTEM_CHANNEL_PROTECTED', message: guard.message } },
          403
        );
      }
    } else if (operation === 'update' || operation === 'delete') {
      const targetId = id ?? (typeof match?.id === 'string' ? match.id : null);
      if (!targetId) {
        return jsonResponse(
          { ok: false, error: { code: 'BAD_REQUEST', message: `${operation} requires id for sales_channels` } },
          400
        );
      }
      const existingChannel = await loadSalesChannel(targetId);
      const payloadObj = payload && !Array.isArray(payload) ? payload : null;
      const guard = assertSalesChannelMutationAllowed(operation, existingChannel, payloadObj);
      if (!guard.ok) {
        return jsonResponse(
          { ok: false, error: { code: 'SYSTEM_CHANNEL_PROTECTED', message: guard.message } },
          403
        );
      }
    }
  }

  switch (operation) {
    case 'insert': {
      if (!effectivePayload || Array.isArray(effectivePayload)) {
        return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'insert requires payload object' } }, 400);
      }
      result = await q.insert(effectivePayload).select().maybeSingle();
      resourceId = (result.data as { id?: string } | null)?.id ?? null;
      break;
    }
    case 'upsert': {
      if (!effectivePayload || Array.isArray(effectivePayload)) {
        return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'upsert requires payload object' } }, 400);
      }
      result = await q.upsert(effectivePayload).select().maybeSingle();
      resourceId = (result.data as { id?: string } | null)?.id ?? (effectivePayload.id as string | undefined) ?? null;
      break;
    }
    case 'update': {
      if (!effectivePayload || Array.isArray(effectivePayload)) {
        return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'update requires payload object' } }, 400);
      }
      let query = q.update(effectivePayload);
      if (id) query = query.eq('id', id);
      else if (match) {
        for (const [k, v] of Object.entries(match)) query = query.eq(k, v);
      } else {
        return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'update requires id or match' } }, 400);
      }
      result = await query.select().maybeSingle();
      resourceId = id ?? resourceId;
      break;
    }
    case 'delete': {
      let query = q.delete();
      if (id) query = query.eq('id', id);
      else if (match) {
        for (const [k, v] of Object.entries(match)) query = query.eq(k, v);
      } else {
        return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'delete requires id or match' } }, 400);
      }
      result = await query.select().maybeSingle();
      resourceId = id ?? resourceId;
      break;
    }
    default:
      return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid operation' } }, 400);
  }

  if (result.error) {
    return jsonResponse(
      { ok: false, error: { code: 'DB_ERROR', message: result.error.message } },
      400
    );
  }

  await writeAdminAudit(supabaseAdmin, {
    actorId: user.id,
    actorRole: role,
    action: operation,
    resourceTable: table,
    resourceId,
    payload: effectivePayload ?? match ?? null,
  });

  return jsonResponse({ ok: true, data: result.data });
});
