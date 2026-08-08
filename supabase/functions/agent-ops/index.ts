/**
 * Hermes / external-agent ops API.
 *
 * Auth: Authorization: Bearer <AGENT_API_KEY>
 * Capabilities: AGENT_CAPABILITIES=sales_read,analytics_read,expenses_rw
 *
 * Body: { "action": "<name>", ...params }
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  ALL_AGENT_CAPABILITIES,
  jsonResponse,
  requireAgentAuth,
  requireCapability,
} from '../_shared/agentAuth.ts';
import { corsPreflightResponse } from '../_shared/cors.ts';
import { writeAdminAudit } from '../_shared/staffAuth.ts';

type Json = Record<string, unknown>;

const PAYMENT_METHODS = new Set(['cash', 'card', 'bank_transfer']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_LIST = 100;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function asDate(value: unknown, field: string): string | Response {
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    return jsonResponse(
      { ok: false, error: { code: 'BAD_REQUEST', message: `${field} must be YYYY-MM-DD` } },
      400
    );
  }
  return value;
}

function num(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

/** Month-to-date run-rate from calendar MTD revenue (UTC date parts of asOf). */
export function computeRevenueRunRate(mtdRevenue: number, asOfYmd: string): {
  as_of: string;
  month: string;
  days_elapsed: number;
  days_in_month: number;
  mtd_revenue: number;
  projected_month_revenue: number;
  daily_average: number;
} {
  const [y, m, d] = asOfYmd.split('-').map((x) => Number(x));
  const daysElapsed = Math.max(1, d);
  const dim = daysInMonth(y, m - 1);
  const dailyAverage = mtdRevenue / daysElapsed;
  return {
    as_of: asOfYmd,
    month: `${y}-${String(m).padStart(2, '0')}`,
    days_elapsed: daysElapsed,
    days_in_month: dim,
    mtd_revenue: mtdRevenue,
    projected_month_revenue: dailyAverage * dim,
    daily_average: dailyAverage,
  };
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function sumSales(
  supabase: ReturnType<typeof adminClient>,
  start: string,
  end: string
): Promise<{ revenue: number; row_count: number; by_source: Record<string, number> }> {
  const { data, error } = await supabase
    .from('sales')
    .select('total_price, source, order_status')
    .gte('sale_date', start)
    .lte('sale_date', `${end}T23:59:59`);

  if (error) throw new Error(error.message);

  let revenue = 0;
  let rowCount = 0;
  const bySource: Record<string, number> = {};
  for (const row of data ?? []) {
    const status = String((row as Json).order_status ?? '').toLowerCase();
    if (status === 'cancelled' || status === 'canceled') continue;
    const amount = num((row as Json).total_price);
    revenue += amount;
    rowCount += 1;
    const source = String((row as Json).source ?? 'unknown');
    bySource[source] = (bySource[source] ?? 0) + amount;
  }
  return { revenue, row_count: rowCount, by_source: bySource };
}

async function sumExpenses(
  supabase: ReturnType<typeof adminClient>,
  start: string,
  end: string
): Promise<number> {
  const { data, error } = await supabase
    .from('operational_expenses')
    .select('amount')
    .gte('expense_date', start)
    .lte('expense_date', end);
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((sum, row) => sum + num((row as Json).amount), 0);
}

async function sumPurchases(
  supabase: ReturnType<typeof adminClient>,
  start: string,
  end: string
): Promise<number> {
  const { data, error } = await supabase
    .from('purchases')
    .select('total_cost')
    .gte('purchase_date', start)
    .lte('purchase_date', end);
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((sum, row) => sum + num((row as Json).total_cost), 0);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  const auth = requireAgentAuth(req);
  if (auth instanceof Response) return auth;
  const { capabilities } = auth;

  let body: Json;
  try {
    body = (await req.json()) as Json;
  } catch {
    return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } }, 400);
  }

  const action = typeof body.action === 'string' ? body.action.trim() : '';
  if (!action) {
    return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'action is required' } }, 400);
  }

  const supabase = adminClient();

  try {
    switch (action) {
      case 'list_capabilities': {
        return jsonResponse({
          ok: true,
          data: {
            enabled: [...capabilities].sort(),
            available: ALL_AGENT_CAPABILITIES,
            notes: {
              sales_read: 'Read sales rows and revenue totals for a date range',
              analytics_read:
                'Period snapshot + monthly revenue run-rate (restaurant pacing estimate, not SaaS MRR)',
              expenses_rw: 'List/create/update/delete operational expenses and list categories/items',
            },
          },
        });
      }

      case 'get_sales_summary': {
        const denied = requireCapability(capabilities, 'sales_read');
        if (denied) return denied;
        const start = asDate(body.start_date, 'start_date');
        if (start instanceof Response) return start;
        const end = asDate(body.end_date ?? body.start_date, 'end_date');
        if (end instanceof Response) return end;
        if (start > end) {
          return jsonResponse(
            { ok: false, error: { code: 'BAD_REQUEST', message: 'start_date must be <= end_date' } },
            400
          );
        }
        const summary = await sumSales(supabase, start, end);
        return jsonResponse({
          ok: true,
          data: {
            start_date: start,
            end_date: end,
            currency: 'AZN',
            ...summary,
            avg_sale_value: summary.row_count > 0 ? summary.revenue / summary.row_count : 0,
          },
        });
      }

      case 'list_sales': {
        const denied = requireCapability(capabilities, 'sales_read');
        if (denied) return denied;
        const start = asDate(body.start_date, 'start_date');
        if (start instanceof Response) return start;
        const end = asDate(body.end_date ?? body.start_date, 'end_date');
        if (end instanceof Response) return end;
        const limit = Math.min(
          MAX_LIST,
          Math.max(1, typeof body.limit === 'number' ? Math.floor(body.limit) : 50)
        );
        const { data, error } = await supabase
          .from('sales')
          .select(
            'id, sale_date, total_price, quantity, source, order_status, payment_status, payment_method, display_number, customer_name, sales_channel_id'
          )
          .gte('sale_date', start)
          .lte('sale_date', `${end}T23:59:59`)
          .order('sale_date', { ascending: false })
          .limit(limit);
        if (error) throw new Error(error.message);
        return jsonResponse({ ok: true, data: { start_date: start, end_date: end, rows: data ?? [] } });
      }

      case 'get_revenue_run_rate': {
        const denied = requireCapability(capabilities, 'analytics_read');
        if (denied) return denied;
        const today = new Date().toISOString().slice(0, 10);
        const asOf = asDate(body.as_of ?? today, 'as_of');
        if (asOf instanceof Response) return asOf;
        const monthStart = `${asOf.slice(0, 7)}-01`;
        const summary = await sumSales(supabase, monthStart, asOf);
        const runRate = computeRevenueRunRate(summary.revenue, asOf);

        let opex: number | null = null;
        let purchaseCost: number | null = null;
        if (capabilities.has('analytics_read')) {
          opex = await sumExpenses(supabase, monthStart, asOf);
          purchaseCost = await sumPurchases(supabase, monthStart, asOf);
        }

        return jsonResponse({
          ok: true,
          data: {
            currency: 'AZN',
            disclaimer:
              'projected_month_revenue is a linear pacing estimate from MTD sales (restaurant run-rate), not SaaS MRR.',
            ...runRate,
            by_source: summary.by_source,
            sale_row_count: summary.row_count,
            mtd_operational_expenses: opex,
            mtd_purchase_cost: purchaseCost,
            mtd_net_after_opex_and_purchases:
              opex != null && purchaseCost != null
                ? summary.revenue - opex - purchaseCost
                : null,
          },
        });
      }

      case 'get_period_snapshot': {
        const denied = requireCapability(capabilities, 'analytics_read');
        if (denied) return denied;
        const start = asDate(body.start_date, 'start_date');
        if (start instanceof Response) return start;
        const end = asDate(body.end_date ?? body.start_date, 'end_date');
        if (end instanceof Response) return end;
        const [sales, opex, purchases] = await Promise.all([
          sumSales(supabase, start, end),
          sumExpenses(supabase, start, end),
          sumPurchases(supabase, start, end),
        ]);
        return jsonResponse({
          ok: true,
          data: {
            start_date: start,
            end_date: end,
            currency: 'AZN',
            revenue: sales.revenue,
            sale_row_count: sales.row_count,
            by_source: sales.by_source,
            operational_expenses: opex,
            purchase_cost: purchases,
            net_after_opex_and_purchases: sales.revenue - opex - purchases,
          },
        });
      }

      case 'list_expense_categories': {
        const denied = requireCapability(capabilities, 'expenses_rw');
        if (denied) return denied;
        const [cats, items] = await Promise.all([
          supabase
            .from('master_categories')
            .select('id, name, color, type, is_active')
            .eq('type', 'expense')
            .order('name'),
          supabase
            .from('expense_items')
            .select('id, name, master_category_id, is_active')
            .order('name'),
        ]);
        if (cats.error) throw new Error(cats.error.message);
        if (items.error) throw new Error(items.error.message);
        return jsonResponse({
          ok: true,
          data: {
            categories: cats.data ?? [],
            items: items.data ?? [],
          },
        });
      }

      case 'list_expenses': {
        const denied = requireCapability(capabilities, 'expenses_rw');
        if (denied) return denied;
        const start = asDate(body.start_date, 'start_date');
        if (start instanceof Response) return start;
        const end = asDate(body.end_date ?? body.start_date, 'end_date');
        if (end instanceof Response) return end;
        const limit = Math.min(
          MAX_LIST,
          Math.max(1, typeof body.limit === 'number' ? Math.floor(body.limit) : 50)
        );
        const { data, error } = await supabase
          .from('operational_expenses')
          .select(
            'id, amount, expense_date, payment_method, description, master_category_id, expense_item_id, master_categories(name), expense_items(name)'
          )
          .gte('expense_date', start)
          .lte('expense_date', end)
          .order('expense_date', { ascending: false })
          .limit(limit);
        if (error) throw new Error(error.message);
        return jsonResponse({ ok: true, data: { start_date: start, end_date: end, rows: data ?? [] } });
      }

      case 'create_expense': {
        const denied = requireCapability(capabilities, 'expenses_rw');
        if (denied) return denied;

        const masterCategoryId =
          typeof body.master_category_id === 'string' ? body.master_category_id : '';
        const expenseItemId = typeof body.expense_item_id === 'string' ? body.expense_item_id : '';
        const amount = num(body.amount);
        const expenseDate = asDate(body.expense_date, 'expense_date');
        if (expenseDate instanceof Response) return expenseDate;
        const paymentMethod =
          typeof body.payment_method === 'string' ? body.payment_method.trim().toLowerCase() : '';
        const description = typeof body.description === 'string' ? body.description.trim() : '';

        if (!isUuid(masterCategoryId) || !isUuid(expenseItemId)) {
          return jsonResponse(
            {
              ok: false,
              error: {
                code: 'BAD_REQUEST',
                message: 'master_category_id and expense_item_id must be UUIDs (use list_expense_categories)',
              },
            },
            400
          );
        }
        if (!(amount > 0)) {
          return jsonResponse(
            { ok: false, error: { code: 'BAD_REQUEST', message: 'amount must be > 0' } },
            400
          );
        }
        if (!PAYMENT_METHODS.has(paymentMethod)) {
          return jsonResponse(
            {
              ok: false,
              error: {
                code: 'BAD_REQUEST',
                message: 'payment_method must be cash | card | bank_transfer',
              },
            },
            400
          );
        }

        const payload = {
          master_category_id: masterCategoryId,
          expense_item_id: expenseItemId,
          amount,
          expense_date: expenseDate,
          payment_method: paymentMethod,
          description,
        };

        const { data, error } = await supabase
          .from('operational_expenses')
          .insert(payload)
          .select('id, amount, expense_date, payment_method, description, master_category_id, expense_item_id')
          .single();
        if (error) throw new Error(error.message);

        await writeAdminAudit(supabase, {
          actorId: null,
          actorRole: 'agent',
          action: 'insert',
          resourceTable: 'operational_expenses',
          resourceId: data.id,
          payload,
        });

        return jsonResponse({ ok: true, data });
      }

      case 'update_expense': {
        const denied = requireCapability(capabilities, 'expenses_rw');
        if (denied) return denied;
        const id = typeof body.id === 'string' ? body.id : '';
        if (!isUuid(id)) {
          return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'id must be a UUID' } }, 400);
        }

        const patch: Json = {};
        if (body.amount !== undefined) {
          const amount = num(body.amount);
          if (!(amount > 0)) {
            return jsonResponse(
              { ok: false, error: { code: 'BAD_REQUEST', message: 'amount must be > 0' } },
              400
            );
          }
          patch.amount = amount;
        }
        if (body.expense_date !== undefined) {
          const expenseDate = asDate(body.expense_date, 'expense_date');
          if (expenseDate instanceof Response) return expenseDate;
          patch.expense_date = expenseDate;
        }
        if (body.payment_method !== undefined) {
          const paymentMethod = String(body.payment_method).trim().toLowerCase();
          if (!PAYMENT_METHODS.has(paymentMethod)) {
            return jsonResponse(
              {
                ok: false,
                error: { code: 'BAD_REQUEST', message: 'payment_method must be cash | card | bank_transfer' },
              },
              400
            );
          }
          patch.payment_method = paymentMethod;
        }
        if (body.description !== undefined) {
          patch.description = String(body.description);
        }
        if (body.master_category_id !== undefined) {
          if (typeof body.master_category_id !== 'string' || !isUuid(body.master_category_id)) {
            return jsonResponse(
              { ok: false, error: { code: 'BAD_REQUEST', message: 'master_category_id must be a UUID' } },
              400
            );
          }
          patch.master_category_id = body.master_category_id;
        }
        if (body.expense_item_id !== undefined) {
          if (typeof body.expense_item_id !== 'string' || !isUuid(body.expense_item_id)) {
            return jsonResponse(
              { ok: false, error: { code: 'BAD_REQUEST', message: 'expense_item_id must be a UUID' } },
              400
            );
          }
          patch.expense_item_id = body.expense_item_id;
        }

        if (Object.keys(patch).length === 0) {
          return jsonResponse(
            { ok: false, error: { code: 'BAD_REQUEST', message: 'No fields to update' } },
            400
          );
        }

        const { data, error } = await supabase
          .from('operational_expenses')
          .update(patch)
          .eq('id', id)
          .select('id, amount, expense_date, payment_method, description, master_category_id, expense_item_id')
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) {
          return jsonResponse({ ok: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } }, 404);
        }

        await writeAdminAudit(supabase, {
          actorId: null,
          actorRole: 'agent',
          action: 'update',
          resourceTable: 'operational_expenses',
          resourceId: id,
          payload: patch,
        });

        return jsonResponse({ ok: true, data });
      }

      case 'delete_expense': {
        const denied = requireCapability(capabilities, 'expenses_rw');
        if (denied) return denied;
        const id = typeof body.id === 'string' ? body.id : '';
        if (!isUuid(id)) {
          return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'id must be a UUID' } }, 400);
        }

        const { data, error } = await supabase
          .from('operational_expenses')
          .delete()
          .eq('id', id)
          .select('id')
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) {
          return jsonResponse({ ok: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } }, 404);
        }

        await writeAdminAudit(supabase, {
          actorId: null,
          actorRole: 'agent',
          action: 'delete',
          resourceTable: 'operational_expenses',
          resourceId: id,
          payload: { id },
        });

        return jsonResponse({ ok: true, data: { id } });
      }

      default:
        return jsonResponse(
          {
            ok: false,
            error: {
              code: 'UNKNOWN_ACTION',
              message: `Unknown action "${action}"`,
              enabled_capabilities: [...capabilities],
            },
          },
          400
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ ok: false, error: { code: 'INTERNAL', message } }, 500);
  }
});
