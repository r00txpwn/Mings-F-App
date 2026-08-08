/**
 * Hermes / external-agent ops API.
 *
 * Auth: Authorization: Bearer <AGENT_API_KEY>
 * Capabilities: AGENT_CAPABILITIES=sales_read,analytics_read,expenses_read,expenses_write
 * Writes also need AGENT_MUTATIONS_ENABLED=true and body.confirm=true.
 * Deletes need a separate expenses_delete capability (off by default).
 *
 * Body: { "action": "<name>", ...params }
 * Server-to-server only (browser Origin rejected).
 */
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import {
  ALL_AGENT_CAPABILITIES,
  jsonResponse,
  mutationsEnabled,
  requireAgentAuth,
  requireCapability,
  requireConfirmWrite,
  requireMutationsEnabled,
} from '../_shared/agentAuth.ts';
import { writeAdminAudit } from '../_shared/staffAuth.ts';

type Json = Record<string, unknown>;

const PAYMENT_METHODS = new Set(['cash', 'card', 'bank_transfer']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_LIST = 100;
const MAX_RANGE_DAYS = 366;
const MAX_DESCRIPTION_LEN = 2000;
const MAX_AMOUNT = 1_000_000;
const PAGE_SIZE = 1000;
const BAKU_TZ = 'Asia/Baku';
/** Refuse editing/deleting expenses older than this many days (expense_date). */
const MAX_MUTATE_AGE_DAYS = 45;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function isValidYmd(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map((x) => Number(x));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function asDate(value: unknown, field: string): string | Response {
  if (typeof value !== 'string' || !isValidYmd(value)) {
    return jsonResponse(
      { ok: false, error: { code: 'BAD_REQUEST', message: `${field} must be a real YYYY-MM-DD date` } },
      400
    );
  }
  return value;
}

function assertRange(start: string, end: string): Response | null {
  if (start > end) {
    return jsonResponse(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'start_date must be <= end_date' } },
      400
    );
  }
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  const days = Math.round((b - a) / 86_400_000) + 1;
  if (days > MAX_RANGE_DAYS) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: `Date range cannot exceed ${MAX_RANGE_DAYS} days`,
        },
      },
      400
    );
  }
  return null;
}

function num(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

function todayInBaku(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BAKU_TZ }).format(new Date());
}

function assertNotFutureDate(ymd: string, field: string): Response | null {
  if (ymd > todayInBaku()) {
    return jsonResponse(
      {
        ok: false,
        error: { code: 'BAD_REQUEST', message: `${field} cannot be in the future (${BAKU_TZ})` },
      },
      400
    );
  }
  return null;
}

function assertExpenseDateMutable(expenseDate: string): Response | null {
  const today = todayInBaku();
  const t = Date.parse(`${today}T00:00:00Z`);
  const e = Date.parse(`${expenseDate}T00:00:00Z`);
  if (!Number.isFinite(t) || !Number.isFinite(e)) {
    return jsonResponse(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid expense_date' } },
      400
    );
  }
  const ageDays = Math.round((t - e) / 86_400_000);
  if (ageDays > MAX_MUTATE_AGE_DAYS) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'TOO_OLD',
          message: `Agent cannot mutate expenses older than ${MAX_MUTATE_AGE_DAYS} days. Edit in the cockpit instead.`,
        },
      },
      403
    );
  }
  return null;
}

async function findIdempotentCreate(
  supabase: SupabaseClient,
  idempotencyKey: string
): Promise<Json | null> {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('resource_id, payload, created_at')
    .eq('actor_role', 'agent')
    .eq('action', 'insert')
    .eq('resource_table', 'operational_expenses')
    .contains('payload', { idempotency_key: idempotencyKey })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.resource_id) return null;

  const existing = await supabase
    .from('operational_expenses')
    .select('id, amount, expense_date, payment_method, description, master_category_id, expense_item_id')
    .eq('id', data.resource_id)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  return (existing.data as Json | null) ?? { id: data.resource_id, replayed: true };
}

/** Month-to-date run-rate from calendar MTD revenue (date parts of asOf). */
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

function adminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await fetchPage(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

async function sumSales(
  supabase: SupabaseClient,
  start: string,
  end: string
): Promise<{ revenue: number; row_count: number; by_source: Record<string, number> }> {
  const rows = await fetchAllPages<{
    total_price: number | string | null;
    source: string | null;
    order_status: string | null;
  }>((from, to) =>
    supabase
      .from('sales')
      .select('total_price, source, order_status')
      .gte('sale_date', start)
      .lte('sale_date', `${end}T23:59:59`)
      .range(from, to)
  );

  let revenue = 0;
  let rowCount = 0;
  const bySource: Record<string, number> = {};
  for (const row of rows) {
    const status = String(row.order_status ?? '').toLowerCase();
    if (status === 'cancelled' || status === 'canceled') continue;
    const amount = num(row.total_price);
    revenue += amount;
    rowCount += 1;
    const source = String(row.source ?? 'unknown');
    bySource[source] = (bySource[source] ?? 0) + amount;
  }
  return { revenue, row_count: rowCount, by_source: bySource };
}

async function sumExpenses(supabase: SupabaseClient, start: string, end: string): Promise<number> {
  const rows = await fetchAllPages<{ amount: number | string | null }>((from, to) =>
    supabase
      .from('operational_expenses')
      .select('amount')
      .gte('expense_date', start)
      .lte('expense_date', end)
      .range(from, to)
  );
  return rows.reduce((sum, row) => sum + num(row.amount), 0);
}

async function sumPurchases(supabase: SupabaseClient, start: string, end: string): Promise<number> {
  const rows = await fetchAllPages<{ total_cost: number | string | null }>((from, to) =>
    supabase
      .from('purchases')
      .select('total_cost')
      .gte('purchase_date', start)
      .lte('purchase_date', end)
      .range(from, to)
  );
  return rows.reduce((sum, row) => sum + num(row.total_cost), 0);
}

async function assertExpenseRefs(
  supabase: SupabaseClient,
  masterCategoryId: string,
  expenseItemId: string
): Promise<Response | null> {
  // Schema has no is_active on master_categories / expense_items — do not select it.
  const [catRes, itemRes] = await Promise.all([
    supabase
      .from('master_categories')
      .select('id, type')
      .eq('id', masterCategoryId)
      .maybeSingle(),
    supabase
      .from('expense_items')
      .select('id, master_category_id')
      .eq('id', expenseItemId)
      .maybeSingle(),
  ]);
  if (catRes.error) throw new Error(catRes.error.message);
  if (itemRes.error) throw new Error(itemRes.error.message);
  if (!catRes.data || catRes.data.type !== 'expense') {
    return jsonResponse(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'master_category_id must be an expense category' } },
      400
    );
  }
  if (!itemRes.data) {
    return jsonResponse(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'expense_item_id not found' } },
      400
    );
  }
  if (itemRes.data.master_category_id !== masterCategoryId) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'expense_item_id does not belong to master_category_id',
        },
      },
      400
    );
  }
  return null;
}

Deno.serve(async (req: Request) => {
  // No CORS preflight success — this API is not for browsers.
  if (req.method === 'OPTIONS') {
    return jsonResponse(
      { ok: false, error: { code: 'BROWSER_FORBIDDEN', message: 'agent-ops is server-to-server only' } },
      403
    );
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  const auth = await requireAgentAuth(req);
  if (auth instanceof Response) return auth;
  const { capabilities } = auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'Body must be a JSON object' } },
      400
    );
  }
  const bodyObj = body as Json;

  const action = typeof bodyObj.action === 'string' ? bodyObj.action.trim() : '';
  if (!action) {
    return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'action is required' } }, 400);
  }

  const supabase = adminClient();

  try {
    switch (action) {
      case 'list_capabilities': {
        const warnings: string[] = [];
        if (capabilities.size === 0) {
          warnings.push('AGENT_CAPABILITIES is empty — all data tools are denied until you set it');
        }
        if (!mutationsEnabled()) {
          warnings.push('AGENT_MUTATIONS_ENABLED is not true — create/update/delete are blocked');
        }
        if (!capabilities.has('expenses_delete')) {
          warnings.push('expenses_delete is off — Hermes cannot delete expense rows');
        }
        return jsonResponse({
          ok: true,
          data: {
            enabled: [...capabilities].sort(),
            available: ALL_AGENT_CAPABILITIES,
            mutations_enabled: mutationsEnabled(),
            timezone: BAKU_TZ,
            max_mutate_age_days: MAX_MUTATE_AGE_DAYS,
            warnings,
            notes: {
              sales_read: 'Read sales rows and revenue totals for a date range',
              analytics_read:
                'Period snapshot + monthly revenue run-rate (restaurant pacing estimate, not SaaS MRR)',
              expenses_read: 'List expense categories/items and expense rows',
              expenses_write:
                'Create/update expenses (needs AGENT_MUTATIONS_ENABLED=true + confirm:true + idempotency_key on create)',
              expenses_delete:
                'Hard-delete expenses (off unless explicitly enabled; still needs mutations + confirm)',
              purchases_read:
                'List purchase/COGS rows and category totals (inventory cost, not opex)',
            },
            recommended:
              'sales_read,analytics_read,expenses_read,purchases_read,expenses_write — leave expenses_delete off',
          },
        });
      }

      case 'get_sales_summary': {
        const denied = requireCapability(capabilities, 'sales_read');
        if (denied) return denied;
        const start = asDate(bodyObj.start_date, 'start_date');
        if (start instanceof Response) return start;
        const end = asDate(bodyObj.end_date ?? bodyObj.start_date, 'end_date');
        if (end instanceof Response) return end;
        const rangeErr = assertRange(start, end);
        if (rangeErr) return rangeErr;
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
        const start = asDate(bodyObj.start_date, 'start_date');
        if (start instanceof Response) return start;
        const end = asDate(bodyObj.end_date ?? bodyObj.start_date, 'end_date');
        if (end instanceof Response) return end;
        const rangeErr = assertRange(start, end);
        if (rangeErr) return rangeErr;
        const limit = Math.min(
          MAX_LIST,
          Math.max(1, typeof bodyObj.limit === 'number' ? Math.floor(bodyObj.limit) : 50)
        );
        // No customer PII (name/phone/address) — ops analytics only.
        // Fetch a small buffer then drop cancelled so the page still fills when possible.
        const { data, error } = await supabase
          .from('sales')
          .select(
            'id, sale_date, total_price, quantity, source, order_status, payment_status, payment_method, display_number, sales_channel_id'
          )
          .gte('sale_date', start)
          .lte('sale_date', `${end}T23:59:59`)
          .order('sale_date', { ascending: false })
          .limit(Math.min(MAX_LIST, limit + 30));
        if (error) throw new Error(error.message);
        const rows = (data ?? [])
          .filter((row) => {
            const status = String((row as Json).order_status ?? '').toLowerCase();
            return status !== 'cancelled' && status !== 'canceled';
          })
          .slice(0, limit);
        return jsonResponse({ ok: true, data: { start_date: start, end_date: end, rows } });
      }

      case 'get_revenue_run_rate': {
        const denied = requireCapability(capabilities, 'analytics_read');
        if (denied) return denied;
        const asOf = asDate(bodyObj.as_of ?? todayInBaku(), 'as_of');
        if (asOf instanceof Response) return asOf;
        const monthStart = `${asOf.slice(0, 7)}-01`;
        const rangeErr = assertRange(monthStart, asOf);
        if (rangeErr) return rangeErr;
        const summary = await sumSales(supabase, monthStart, asOf);
        const runRate = computeRevenueRunRate(summary.revenue, asOf);
        const opex = await sumExpenses(supabase, monthStart, asOf);
        const purchaseCost = await sumPurchases(supabase, monthStart, asOf);

        return jsonResponse({
          ok: true,
          data: {
            currency: 'AZN',
            timezone: BAKU_TZ,
            disclaimer:
              'projected_month_revenue is a linear pacing estimate from MTD sales (restaurant run-rate), not SaaS MRR.',
            ...runRate,
            by_source: summary.by_source,
            sale_row_count: summary.row_count,
            mtd_operational_expenses: opex,
            mtd_purchase_cost: purchaseCost,
            mtd_net_after_opex_and_purchases: summary.revenue - opex - purchaseCost,
          },
        });
      }

      case 'get_period_snapshot': {
        const denied = requireCapability(capabilities, 'analytics_read');
        if (denied) return denied;
        const start = asDate(bodyObj.start_date, 'start_date');
        if (start instanceof Response) return start;
        const end = asDate(bodyObj.end_date ?? bodyObj.start_date, 'end_date');
        if (end instanceof Response) return end;
        const rangeErr = assertRange(start, end);
        if (rangeErr) return rangeErr;
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
            timezone: BAKU_TZ,
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
        const denied = requireCapability(capabilities, 'expenses_read');
        if (denied) return denied;
        // No is_active column on these tables in production schema.
        const [cats, items] = await Promise.all([
          supabase
            .from('master_categories')
            .select('id, name, color, type')
            .eq('type', 'expense')
            .order('name'),
          supabase
            .from('expense_items')
            .select('id, name, master_category_id')
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
        const denied = requireCapability(capabilities, 'expenses_read');
        if (denied) return denied;
        const start = asDate(bodyObj.start_date, 'start_date');
        if (start instanceof Response) return start;
        const end = asDate(bodyObj.end_date ?? bodyObj.start_date, 'end_date');
        if (end instanceof Response) return end;
        const rangeErr = assertRange(start, end);
        if (rangeErr) return rangeErr;
        const limit = Math.min(
          MAX_LIST,
          Math.max(1, typeof bodyObj.limit === 'number' ? Math.floor(bodyObj.limit) : 50)
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

      case 'list_purchases': {
        const denied = requireCapability(capabilities, 'purchases_read');
        if (denied) return denied;
        const start = asDate(bodyObj.start_date, 'start_date');
        if (start instanceof Response) return start;
        const end = asDate(bodyObj.end_date ?? bodyObj.start_date, 'end_date');
        if (end instanceof Response) return end;
        const rangeErr = assertRange(start, end);
        if (rangeErr) return rangeErr;
        const limit = Math.min(
          MAX_LIST,
          Math.max(1, typeof bodyObj.limit === 'number' ? Math.floor(bodyObj.limit) : 50)
        );
        // Match cockpit COGS date bound (purchase_date may be timestamptz).
        const { data, error } = await supabase
          .from('purchases')
          .select(
            'id, total_cost, quantity, unit_cost, purchase_date, payment_method, payment_status, is_on_credit, notes, master_category_id, expense_item_id, products(name), suppliers(name), master_categories(name, color), expense_items(name)'
          )
          .gte('purchase_date', start)
          .lte('purchase_date', `${end}T23:59:59`)
          .order('purchase_date', { ascending: false })
          .limit(limit);
        if (error) throw new Error(error.message);
        return jsonResponse({ ok: true, data: { start_date: start, end_date: end, rows: data ?? [] } });
      }

      case 'get_purchases_summary': {
        const denied = requireCapability(capabilities, 'purchases_read');
        if (denied) return denied;
        const start = asDate(bodyObj.start_date, 'start_date');
        if (start instanceof Response) return start;
        const end = asDate(bodyObj.end_date ?? bodyObj.start_date, 'end_date');
        if (end instanceof Response) return end;
        const rangeErr = assertRange(start, end);
        if (rangeErr) return rangeErr;

        type PurchaseSumRow = {
          total_cost: number | string | null;
          master_category_id: string | null;
          // Postgrest typings may treat embed as array; runtime is usually a single object.
          master_categories: unknown;
        };

        const rows = await fetchAllPages<PurchaseSumRow>((from, to) =>
          supabase
            .from('purchases')
            .select('total_cost, master_category_id, master_categories(name, color)')
            .gte('purchase_date', start)
            .lte('purchase_date', `${end}T23:59:59`)
            .range(from, to) as PromiseLike<{
            data: PurchaseSumRow[] | null;
            error: { message: string } | null;
          }>
        );

        function catMeta(embed: unknown): { name: string | null; color: string | null } {
          if (!embed) return { name: null, color: null };
          const obj = Array.isArray(embed) ? embed[0] : embed;
          if (!obj || typeof obj !== 'object') return { name: null, color: null };
          const rec = obj as { name?: string | null; color?: string | null };
          return { name: rec.name ?? null, color: rec.color ?? null };
        }

        const byCat = new Map<
          string,
          { master_category_id: string | null; name: string; color: string | null; total: number; count: number }
        >();
        let grand = 0;
        for (const row of rows) {
          const cost = num(row.total_cost);
          grand += cost;
          const catId = row.master_category_id ?? '';
          const key = catId || '__uncategorized__';
          const prev = byCat.get(key);
          const meta = catMeta(row.master_categories);
          const catName = meta.name ?? (catId ? 'Unknown' : 'Uncategorized');
          const catColor = meta.color;
          if (prev) {
            prev.total += cost;
            prev.count += 1;
          } else {
            byCat.set(key, {
              master_category_id: catId || null,
              name: String(catName),
              color: catColor,
              total: cost,
              count: 1,
            });
          }
        }

        const round2 = (n: number) => Math.round(n * 100) / 100;
        const categories = [...byCat.values()]
          .map((c) => ({
            master_category_id: c.master_category_id,
            name: c.name,
            color: c.color,
            total: round2(c.total),
            count: c.count,
            percent_of_total: grand > 0 ? Math.round((c.total / grand) * 1000) / 10 : 0,
          }))
          .sort((a, b) => b.total - a.total);

        return jsonResponse({
          ok: true,
          data: {
            start_date: start,
            end_date: end,
            currency: 'AZN',
            total: round2(grand),
            row_count: rows.length,
            by_category: categories,
          },
        });
      }

      case 'create_expense': {
        const denied = requireCapability(capabilities, 'expenses_write');
        if (denied) return denied;
        const mutOff = requireMutationsEnabled();
        if (mutOff) return mutOff;
        const confirmErr = requireConfirmWrite(bodyObj);
        if (confirmErr) return confirmErr;

        const idempotencyKey =
          typeof bodyObj.idempotency_key === 'string' ? bodyObj.idempotency_key.trim() : '';
        if (!isUuid(idempotencyKey)) {
          return jsonResponse(
            {
              ok: false,
              error: {
                code: 'BAD_REQUEST',
                message: 'idempotency_key (UUID) is required on create to prevent double inserts',
              },
            },
            400
          );
        }

        const replay = await findIdempotentCreate(supabase, idempotencyKey);
        if (replay) {
          return jsonResponse({ ok: true, data: { ...replay, idempotent_replay: true } });
        }

        const masterCategoryId =
          typeof bodyObj.master_category_id === 'string' ? bodyObj.master_category_id : '';
        const expenseItemId = typeof bodyObj.expense_item_id === 'string' ? bodyObj.expense_item_id : '';
        const amount = num(bodyObj.amount);
        const expenseDate = asDate(bodyObj.expense_date, 'expense_date');
        if (expenseDate instanceof Response) return expenseDate;
        const futureErr = assertNotFutureDate(expenseDate, 'expense_date');
        if (futureErr) return futureErr;
        const ageErr = assertExpenseDateMutable(expenseDate);
        if (ageErr) return ageErr;
        const paymentMethod =
          typeof bodyObj.payment_method === 'string' ? bodyObj.payment_method.trim().toLowerCase() : '';
        const description =
          typeof bodyObj.description === 'string' ? bodyObj.description.trim() : '';

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
        if (!(amount > 0) || amount > MAX_AMOUNT) {
          return jsonResponse(
            {
              ok: false,
              error: { code: 'BAD_REQUEST', message: `amount must be > 0 and <= ${MAX_AMOUNT}` },
            },
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
        if (description.length > MAX_DESCRIPTION_LEN) {
          return jsonResponse(
            {
              ok: false,
              error: {
                code: 'BAD_REQUEST',
                message: `description must be <= ${MAX_DESCRIPTION_LEN} characters`,
              },
            },
            400
          );
        }

        const refErr = await assertExpenseRefs(supabase, masterCategoryId, expenseItemId);
        if (refErr) return refErr;

        const rowPayload = {
          master_category_id: masterCategoryId,
          expense_item_id: expenseItemId,
          amount,
          expense_date: expenseDate,
          payment_method: paymentMethod,
          description,
        };

        const { data, error } = await supabase
          .from('operational_expenses')
          .insert(rowPayload)
          .select('id, amount, expense_date, payment_method, description, master_category_id, expense_item_id')
          .single();
        if (error) throw new Error(error.message);

        await writeAdminAudit(supabase, {
          actorId: null,
          actorRole: 'agent',
          action: 'insert',
          resourceTable: 'operational_expenses',
          resourceId: data.id,
          payload: { ...rowPayload, idempotency_key: idempotencyKey },
        });

        return jsonResponse({ ok: true, data });
      }

      case 'update_expense': {
        const denied = requireCapability(capabilities, 'expenses_write');
        if (denied) return denied;
        const mutOff = requireMutationsEnabled();
        if (mutOff) return mutOff;
        const confirmErr = requireConfirmWrite(bodyObj);
        if (confirmErr) return confirmErr;

        const id = typeof bodyObj.id === 'string' ? bodyObj.id : '';
        if (!isUuid(id)) {
          return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'id must be a UUID' } }, 400);
        }

        const { data: existing, error: existingErr } = await supabase
          .from('operational_expenses')
          .select('id, expense_date, master_category_id, expense_item_id')
          .eq('id', id)
          .maybeSingle();
        if (existingErr) throw new Error(existingErr.message);
        if (!existing) {
          return jsonResponse({ ok: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } }, 404);
        }
        const existingAgeErr = assertExpenseDateMutable(String(existing.expense_date).slice(0, 10));
        if (existingAgeErr) return existingAgeErr;

        const patch: Json = {};
        if (bodyObj.amount !== undefined) {
          const amount = num(bodyObj.amount);
          if (!(amount > 0) || amount > MAX_AMOUNT) {
            return jsonResponse(
              {
                ok: false,
                error: { code: 'BAD_REQUEST', message: `amount must be > 0 and <= ${MAX_AMOUNT}` },
              },
              400
            );
          }
          patch.amount = amount;
        }
        if (bodyObj.expense_date !== undefined) {
          const expenseDate = asDate(bodyObj.expense_date, 'expense_date');
          if (expenseDate instanceof Response) return expenseDate;
          const futureErr = assertNotFutureDate(expenseDate, 'expense_date');
          if (futureErr) return futureErr;
          const ageErr = assertExpenseDateMutable(expenseDate);
          if (ageErr) return ageErr;
          patch.expense_date = expenseDate;
        }
        if (bodyObj.payment_method !== undefined) {
          const paymentMethod = String(bodyObj.payment_method).trim().toLowerCase();
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
        if (bodyObj.description !== undefined) {
          const description = String(bodyObj.description);
          if (description.length > MAX_DESCRIPTION_LEN) {
            return jsonResponse(
              {
                ok: false,
                error: {
                  code: 'BAD_REQUEST',
                  message: `description must be <= ${MAX_DESCRIPTION_LEN} characters`,
                },
              },
              400
            );
          }
          patch.description = description;
        }
        if (bodyObj.master_category_id !== undefined) {
          if (typeof bodyObj.master_category_id !== 'string' || !isUuid(bodyObj.master_category_id)) {
            return jsonResponse(
              { ok: false, error: { code: 'BAD_REQUEST', message: 'master_category_id must be a UUID' } },
              400
            );
          }
          patch.master_category_id = bodyObj.master_category_id;
        }
        if (bodyObj.expense_item_id !== undefined) {
          if (typeof bodyObj.expense_item_id !== 'string' || !isUuid(bodyObj.expense_item_id)) {
            return jsonResponse(
              { ok: false, error: { code: 'BAD_REQUEST', message: 'expense_item_id must be a UUID' } },
              400
            );
          }
          patch.expense_item_id = bodyObj.expense_item_id;
        }

        if (Object.keys(patch).length === 0) {
          return jsonResponse(
            { ok: false, error: { code: 'BAD_REQUEST', message: 'No fields to update' } },
            400
          );
        }

        if (patch.master_category_id !== undefined || patch.expense_item_id !== undefined) {
          const nextCat = String(patch.master_category_id ?? existing.master_category_id);
          const nextItem = String(patch.expense_item_id ?? existing.expense_item_id);
          const refErr = await assertExpenseRefs(supabase, nextCat, nextItem);
          if (refErr) return refErr;
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
        // Hard delete is opt-in only — never part of the recommended allowlist.
        const denied = requireCapability(capabilities, 'expenses_delete');
        if (denied) return denied;
        const mutOff = requireMutationsEnabled();
        if (mutOff) return mutOff;
        const confirmErr = requireConfirmWrite(bodyObj);
        if (confirmErr) return confirmErr;

        const id = typeof bodyObj.id === 'string' ? bodyObj.id : '';
        if (!isUuid(id)) {
          return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'id must be a UUID' } }, 400);
        }

        const { data: existing, error: existingErr } = await supabase
          .from('operational_expenses')
          .select('id, expense_date')
          .eq('id', id)
          .maybeSingle();
        if (existingErr) throw new Error(existingErr.message);
        if (!existing) {
          return jsonResponse({ ok: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } }, 404);
        }
        const ageErr = assertExpenseDateMutable(String(existing.expense_date).slice(0, 10));
        if (ageErr) return ageErr;

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
