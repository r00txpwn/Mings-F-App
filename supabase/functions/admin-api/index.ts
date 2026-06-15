import {
  corsHeaders,
  jsonResponse,
  requireStaffAuth,
  writeAdminAudit,
  type StaffRole,
} from '../_shared/staffAuth.ts';

type MutationOp = 'insert' | 'update' | 'delete' | 'upsert';

interface MutateBody {
  table: string;
  operation: MutationOp;
  payload?: Record<string, unknown> | Record<string, unknown>[];
  match?: Record<string, unknown>;
  /** Required for update/delete */
  id?: string;
}

const TABLE_MIN_ROLE: Record<string, StaffRole[]> = {
  products: ['admin', 'manager', 'staff'],
  purchases: ['admin', 'manager'],
  operational_expenses: ['admin', 'manager'],
  master_categories: ['admin', 'manager'],
  expense_items: ['admin', 'manager'],
  suppliers: ['admin', 'manager'],
  sales_channels: ['admin'],
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

  let result;
  let resourceId: string | null = id ?? null;

  switch (operation) {
    case 'insert': {
      if (!payload || Array.isArray(payload)) {
        return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'insert requires payload object' } }, 400);
      }
      result = await q.insert(payload).select().maybeSingle();
      resourceId = (result.data as { id?: string } | null)?.id ?? null;
      break;
    }
    case 'upsert': {
      if (!payload || Array.isArray(payload)) {
        return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'upsert requires payload object' } }, 400);
      }
      result = await q.upsert(payload).select().maybeSingle();
      resourceId = (result.data as { id?: string } | null)?.id ?? (payload.id as string | undefined) ?? null;
      break;
    }
    case 'update': {
      if (!payload || Array.isArray(payload)) {
        return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'update requires payload object' } }, 400);
      }
      let query = q.update(payload);
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
    payload: payload ?? match ?? null,
  });

  return jsonResponse({ ok: true, data: result.data });
});
