/**
 * Hermes / external-agent ops API.
 *
 * Auth: Authorization: Bearer <AGENT_API_KEY>
 * Capabilities: comma-separated AGENT_CAPABILITIES
 * Writes also need AGENT_MUTATIONS_ENABLED=true and body.confirm=true.
 * Deletes need a separate expenses_delete capability (off by default).
 * Manual sales (Wolt/Bolt/ChoiceQR) need sales_write (off until explicitly enabled).
 * Platform commissions: payouts_read (list/summary with derived commission).
 * Purchase create: purchases_write (off until explicitly enabled).
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
import { isPartnerManualSaleChannelName } from '../_shared/partnerSalesChannels.ts';
import {
  computePurchaseTotalCost,
  purchaseCreditFields,
  roundFinanceMoney,
} from '../_shared/cogsMath.ts';
import { assertSalesMutationAllowed } from '../_shared/salesMutationPolicy.ts';
import { writeAdminAudit } from '../_shared/staffAuth.ts';

type Json = Record<string, unknown>;

const PAYMENT_METHODS = new Set(['cash', 'card', 'bank_transfer']);
const SALARY_PAYMENT_TYPES = new Set(['salary', 'advance', 'bonus', 'partial']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_LIST = 100;
const MAX_RANGE_DAYS = 366;
const MAX_DESCRIPTION_LEN = 2000;
const MAX_AMOUNT = 1_000_000;
const PAGE_SIZE = 1000;
const BAKU_TZ = 'Asia/Baku';
/** Refuse mutating expenses/sales older than this many days (date field). */
const MAX_MUTATE_AGE_DAYS = 45;
const MAX_SALE_QTY = 10_000;
const DEFAULT_PAYOUT_LOOKBACK_DAYS = 90;
const INVOICE_TOTAL_TOLERANCE = 0.02;
const PURCHASE_SELECT =
  'id, total_cost, quantity, unit_cost, discount_percent, purchase_date, payment_method, payment_status, is_on_credit, notes, master_category_id, expense_item_id, supplier_id';
const SALE_SELECT =
  'id, total_price, quantity, unit_price, sales_channel_id, notes, sale_date, source';

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

async function findIdempotentSaleCreate(
  supabase: SupabaseClient,
  idempotencyKey: string
): Promise<Json | null> {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('resource_id, payload, created_at')
    .eq('actor_role', 'agent')
    .eq('action', 'insert')
    .eq('resource_table', 'sales')
    .contains('payload', { idempotency_key: idempotencyKey })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.resource_id) return null;

  const existing = await supabase
    .from('sales')
    .select(SALE_SELECT)
    .eq('id', data.resource_id)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  return (existing.data as Json | null) ?? { id: data.resource_id, replayed: true };
}

type PartnerChannel = { id: string; name: string };

/** Resolve Wolt/Bolt/ChoiceQR channel by UUID or name; only active, non-deleted partner rows. */
async function resolvePartnerChannel(
  supabase: SupabaseClient,
  body: Json
): Promise<PartnerChannel | Response> {
  const channelId = typeof body.sales_channel_id === 'string' ? body.sales_channel_id.trim() : '';
  const channelName =
    typeof body.channel === 'string'
      ? body.channel.trim()
      : typeof body.channel_name === 'string'
        ? body.channel_name.trim()
        : '';

  if (channelId && !isUuid(channelId)) {
    return jsonResponse(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'sales_channel_id must be a UUID' } },
      400
    );
  }
  if (!channelId && !channelName) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'sales_channel_id (UUID) or channel (Wolt|Bolt|ChoiceQR name) is required',
        },
      },
      400
    );
  }

  let query = supabase
    .from('sales_channels')
    .select('id, name, is_active, is_deleted')
    .eq('is_deleted', false)
    .eq('is_active', true);

  if (channelId) {
    query = query.eq('id', channelId);
  } else {
    // Case-insensitive exact name first (canonical DB names: Wolt, Bolt, ChoiceQR).
    query = query.ilike('name', channelName);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.id || typeof data.name !== 'string') {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: channelId
            ? 'sales_channel_id not found or inactive (partner channels only: Wolt, Bolt, ChoiceQR)'
            : `channel "${channelName}" not found or inactive (use Wolt, Bolt, or ChoiceQR)`,
        },
      },
      400
    );
  }
  if (!isPartnerManualSaleChannelName(data.name)) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message:
            'Only partner manual channels may be used (Wolt, Bolt, ChoiceQR). Kiosk/online/POS sales are app-generated.',
        },
      },
      403
    );
  }
  return { id: data.id, name: data.name };
}

function parseSaleQuantity(value: unknown): number | Response {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > MAX_SALE_QTY) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: `quantity must be an integer between 1 and ${MAX_SALE_QTY}`,
        },
      },
      400
    );
  }
  return n;
}

function parseSaleTotal(value: unknown): number | Response {
  const amount = num(value);
  if (!(amount > 0) || amount > MAX_AMOUNT) {
    return jsonResponse(
      {
        ok: false,
        error: { code: 'BAD_REQUEST', message: `total_price must be > 0 and <= ${MAX_AMOUNT}` },
      },
      400
    );
  }
  return amount;
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function addDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map((x) => Number(x));
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Optional start/end on payout_date; default last 90 days (Asia/Baku). */
function resolveOptionalPayoutDateWindow(body: Json): { start: string; end: string } | Response {
  const hasStart = body.start_date !== undefined && body.start_date !== null && body.start_date !== '';
  const hasEnd = body.end_date !== undefined && body.end_date !== null && body.end_date !== '';
  if (hasStart !== hasEnd) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Provide both start_date and end_date for payout_date filter, or omit both (default last 90 days)',
        },
      },
      400
    );
  }
  if (!hasStart) {
    const end = todayInBaku();
    const start = addDaysYmd(end, -(DEFAULT_PAYOUT_LOOKBACK_DAYS - 1));
    return { start, end };
  }
  const start = asDate(body.start_date, 'start_date');
  if (start instanceof Response) return start;
  const end = asDate(body.end_date, 'end_date');
  if (end instanceof Response) return end;
  const rangeErr = assertRange(start, end);
  if (rangeErr) return rangeErr;
  return { start, end };
}

async function sumGrossForChannelPeriod(
  supabase: SupabaseClient,
  channelId: string,
  periodStart: string,
  periodEnd: string
): Promise<number> {
  const rows = await fetchAllPages<{
    total_price: number | string | null;
    order_status: string | null;
  }>((from, to) =>
    supabase
      .from('sales')
      .select('total_price, order_status')
      .eq('sales_channel_id', channelId)
      .gte('sale_date', periodStart)
      .lte('sale_date', `${periodEnd}T23:59:59`)
      .range(from, to)
  );
  let revenue = 0;
  for (const row of rows) {
    const status = String(row.order_status ?? '').toLowerCase();
    if (status === 'cancelled' || status === 'canceled') continue;
    revenue += num(row.total_price);
  }
  return revenue;
}

type PayoutListRow = {
  id: string;
  sales_channel_id: string;
  period_start: string;
  period_end: string;
  payout_amount: number;
  payout_date: string;
  notes: string | null;
  received_account: string | null;
  channel_name: string;
  gross_sales: number;
  commission_amount: number;
  commission_percent: number;
};

async function loadPayoutsWithCommission(
  supabase: SupabaseClient,
  payoutDateStart: string,
  payoutDateEnd: string,
  limit: number
): Promise<PayoutListRow[]> {
  const { data, error } = await supabase
    .from('platform_payouts')
    .select(
      'id, sales_channel_id, period_start, period_end, payout_amount, payout_date, notes, received_account, sales_channels(name)'
    )
    .gte('payout_date', payoutDateStart)
    .lte('payout_date', payoutDateEnd)
    .order('payout_date', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const out: PayoutListRow[] = [];
  for (const raw of data ?? []) {
    const row = raw as {
      id: string;
      sales_channel_id: string;
      period_start: string;
      period_end: string;
      payout_amount: number | string | null;
      payout_date: string;
      notes: string | null;
      received_account: string | null;
      sales_channels: unknown;
    };
    const channelEmbed = Array.isArray(row.sales_channels)
      ? row.sales_channels[0]
      : row.sales_channels;
    const channelName =
      channelEmbed && typeof channelEmbed === 'object' && 'name' in channelEmbed
        ? String((channelEmbed as { name?: string }).name ?? 'Unknown')
        : 'Unknown';
    const payoutAmount = num(row.payout_amount);
    const gross = await sumGrossForChannelPeriod(
      supabase,
      row.sales_channel_id,
      String(row.period_start).slice(0, 10),
      String(row.period_end).slice(0, 10)
    );
    const commission = gross - payoutAmount;
    out.push({
      id: row.id,
      sales_channel_id: row.sales_channel_id,
      period_start: String(row.period_start).slice(0, 10),
      period_end: String(row.period_end).slice(0, 10),
      payout_amount: round2(payoutAmount),
      payout_date: String(row.payout_date).slice(0, 10),
      notes: row.notes,
      received_account: row.received_account,
      channel_name: channelName,
      gross_sales: round2(gross),
      commission_amount: round2(commission),
      commission_percent: gross > 0 ? Math.round((commission / gross) * 1000) / 10 : 0,
    });
  }
  return out;
}

async function findIdempotentPurchaseCreate(
  supabase: SupabaseClient,
  idempotencyKey: string
): Promise<Json | null> {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('resource_id, payload, created_at')
    .eq('actor_role', 'agent')
    .eq('action', 'insert')
    .eq('resource_table', 'purchases')
    .contains('payload', { idempotency_key: idempotencyKey })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.resource_id) return null;

  const existing = await supabase
    .from('purchases')
    .select(PURCHASE_SELECT)
    .eq('id', data.resource_id)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  return (existing.data as Json | null) ?? { id: data.resource_id, replayed: true };
}

async function resolveExpenseItemForPurchase(
  supabase: SupabaseClient,
  body: Json
): Promise<{ id: string; name: string; master_category_id: string } | Response> {
  const itemId = typeof body.expense_item_id === 'string' ? body.expense_item_id.trim() : '';
  const itemName =
    typeof body.expense_item_name === 'string' ? body.expense_item_name.trim() : '';

  if (itemId) {
    if (!isUuid(itemId)) {
      return jsonResponse(
        { ok: false, error: { code: 'BAD_REQUEST', message: 'expense_item_id must be a UUID' } },
        400
      );
    }
    const { data, error } = await supabase
      .from('expense_items')
      .select('id, name, master_category_id')
      .eq('id', itemId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.id || !data.master_category_id) {
      return jsonResponse(
        { ok: false, error: { code: 'BAD_REQUEST', message: 'expense_item_id not found' } },
        400
      );
    }
    return {
      id: data.id,
      name: String(data.name ?? ''),
      master_category_id: data.master_category_id,
    };
  }

  if (!itemName) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'expense_item_id or expense_item_name is required',
        },
      },
      400
    );
  }

  const { data: matches, error } = await supabase
    .from('expense_items')
    .select('id, name, master_category_id')
    .ilike('name', itemName)
    .limit(5);
  if (error) throw new Error(error.message);
  const rows = matches ?? [];
  if (rows.length === 0) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: `expense item "${itemName}" not found — use list_expense_categories`,
        },
      },
      400
    );
  }
  if (rows.length > 1) {
    const exact = rows.filter((r) => String(r.name).toLowerCase() === itemName.toLowerCase());
    if (exact.length === 1 && exact[0].master_category_id) {
      return {
        id: exact[0].id,
        name: String(exact[0].name ?? ''),
        master_category_id: exact[0].master_category_id,
      };
    }
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: `expense item name "${itemName}" is ambiguous — pass expense_item_id`,
          matches: rows.map((r) => ({ id: r.id, name: r.name })),
        },
      },
      400
    );
  }
  const only = rows[0];
  if (!only.master_category_id) {
    return jsonResponse(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'expense item missing master_category_id' } },
      400
    );
  }
  return { id: only.id, name: String(only.name ?? ''), master_category_id: only.master_category_id };
}

/** Find supplier by id or name; create by name if missing. Never duplicates by case-insensitive name. */
async function resolveOrCreateSupplier(
  supabase: SupabaseClient,
  body: Json
): Promise<{ id: string; name: string; created: boolean } | Response> {
  const supplierId = typeof body.supplier_id === 'string' ? body.supplier_id.trim() : '';
  const supplierName = typeof body.supplier_name === 'string' ? body.supplier_name.trim() : '';

  if (supplierId) {
    if (!isUuid(supplierId)) {
      return jsonResponse(
        { ok: false, error: { code: 'BAD_REQUEST', message: 'supplier_id must be a UUID' } },
        400
      );
    }
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('id', supplierId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.id) {
      return jsonResponse(
        { ok: false, error: { code: 'BAD_REQUEST', message: 'supplier_id not found' } },
        400
      );
    }
    return { id: data.id, name: String(data.name ?? ''), created: false };
  }

  if (!supplierName) {
    return jsonResponse(
      {
        ok: false,
        error: { code: 'BAD_REQUEST', message: 'supplier_id or supplier_name is required' },
      },
      400
    );
  }
  if (supplierName.length > 200) {
    return jsonResponse(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'supplier_name too long' } },
      400
    );
  }

  const { data: matches, error: findErr } = await supabase
    .from('suppliers')
    .select('id, name')
    .ilike('name', supplierName)
    .limit(10);
  if (findErr) throw new Error(findErr.message);
  const rows = matches ?? [];
  const exact = rows.filter((r) => String(r.name).toLowerCase() === supplierName.toLowerCase());
  if (exact.length === 1) {
    return { id: exact[0].id, name: String(exact[0].name ?? ''), created: false };
  }
  if (exact.length > 1 || rows.length > 1) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'BAD_REQUEST',
          message: `supplier name "${supplierName}" is ambiguous — pass supplier_id`,
          matches: rows.map((r) => ({ id: r.id, name: r.name })),
        },
      },
      400
    );
  }
  if (rows.length === 1) {
    return { id: rows[0].id, name: String(rows[0].name ?? ''), created: false };
  }

  const { data: created, error: insertErr } = await supabase
    .from('suppliers')
    .insert({ name: supplierName, is_active: true })
    .select('id, name')
    .single();
  if (insertErr) throw new Error(insertErr.message);
  return { id: created.id, name: String(created.name ?? supplierName), created: true };
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
              sales_write:
                'Create/update manual partner sales (Wolt/Bolt/ChoiceQR only; needs AGENT_MUTATIONS_ENABLED=true + confirm:true + idempotency_key on create). Ask owner before writing.',
              analytics_read:
                'Period snapshot + monthly revenue run-rate (restaurant pacing estimate, not SaaS MRR)',
              expenses_read: 'List expense categories/items and expense rows',
              expenses_write:
                'Create/update expenses (needs AGENT_MUTATIONS_ENABLED=true + confirm:true + idempotency_key on create)',
              expenses_delete:
                'Hard-delete expenses (off unless explicitly enabled; still needs mutations + confirm)',
              purchases_read:
                'List purchase/COGS rows and category totals (inventory cost, not opex)',
              purchases_write:
                'Create purchases from invoices (needs AGENT_MUTATIONS_ENABLED=true + confirm:true + idempotency_key). Supplier find-or-create; never invent amounts. Off by default — ask owner before enabling.',
              payouts_read:
                'List platform_payouts with derived commission (gross_sales − payout_amount for each period/channel). Overlapping payout periods can double-count sales in summaries.',
              salaries_read:
                'List salary_payments ledger + summary by type/month (employees roster rates for context). Pair with get_sales_summary for % of revenue. Read-only — no salary writes.',
            },
            recommended:
              'sales_read,analytics_read,expenses_read,purchases_read,payouts_read,salaries_read — leave write caps and expenses_delete off unless owner asks; add purchases_write/sales_write only with mutations + owner confirm',
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

      case 'list_payouts': {
        const denied = requireCapability(capabilities, 'payouts_read');
        if (denied) return denied;
        const window = resolveOptionalPayoutDateWindow(bodyObj);
        if (window instanceof Response) return window;
        const limit = Math.min(
          MAX_LIST,
          Math.max(1, typeof bodyObj.limit === 'number' ? Math.floor(bodyObj.limit) : 50)
        );
        const rows = await loadPayoutsWithCommission(supabase, window.start, window.end, limit);
        return jsonResponse({
          ok: true,
          data: {
            payout_date_start: window.start,
            payout_date_end: window.end,
            currency: 'AZN',
            commission_formula: 'gross_sales - payout_amount (sales for channel over period_start..period_end, excluding cancelled)',
            rows,
          },
        });
      }

      case 'get_payouts_summary': {
        const denied = requireCapability(capabilities, 'payouts_read');
        if (denied) return denied;
        const window = resolveOptionalPayoutDateWindow(bodyObj);
        if (window instanceof Response) return window;
        // Same cap as list — summary uses all rows in window up to MAX_LIST for performance.
        const rows = await loadPayoutsWithCommission(supabase, window.start, window.end, MAX_LIST);

        type ChAgg = {
          sales_channel_id: string;
          channel_name: string;
          payout_total: number;
          gross_sales: number;
          commission: number;
          row_count: number;
        };
        const byChannel = new Map<string, ChAgg>();
        let totalPayouts = 0;
        let totalGross = 0;
        let totalCommission = 0;
        for (const row of rows) {
          totalPayouts += row.payout_amount;
          totalGross += row.gross_sales;
          totalCommission += row.commission_amount;
          const prev = byChannel.get(row.sales_channel_id);
          if (prev) {
            prev.payout_total += row.payout_amount;
            prev.gross_sales += row.gross_sales;
            prev.commission += row.commission_amount;
            prev.row_count += 1;
          } else {
            byChannel.set(row.sales_channel_id, {
              sales_channel_id: row.sales_channel_id,
              channel_name: row.channel_name,
              payout_total: row.payout_amount,
              gross_sales: row.gross_sales,
              commission: row.commission_amount,
              row_count: 1,
            });
          }
        }

        const channels = [...byChannel.values()]
          .map((c) => ({
            sales_channel_id: c.sales_channel_id,
            channel_name: c.channel_name,
            payout_total: round2(c.payout_total),
            gross_sales: round2(c.gross_sales),
            commission: round2(c.commission),
            commission_percent: c.gross_sales > 0 ? Math.round((c.commission / c.gross_sales) * 1000) / 10 : 0,
            row_count: c.row_count,
          }))
          .sort((a, b) => b.commission - a.commission);

        return jsonResponse({
          ok: true,
          data: {
            payout_date_start: window.start,
            payout_date_end: window.end,
            currency: 'AZN',
            note:
              'Per-payout commission matches cockpit (gross sales in period − payout). Channel/totals sum those rows; overlapping periods can double-count sales.',
            total_payouts: round2(totalPayouts),
            total_gross_sales: round2(totalGross),
            total_commission: round2(totalCommission),
            row_count: rows.length,
            by_channel: channels,
          },
        });
      }

      case 'list_salary_payments': {
        const denied = requireCapability(capabilities, 'salaries_read');
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

        const employeeId =
          typeof bodyObj.employee_id === 'string' ? bodyObj.employee_id.trim() : '';
        if (employeeId && !isUuid(employeeId)) {
          return jsonResponse(
            { ok: false, error: { code: 'BAD_REQUEST', message: 'employee_id must be a UUID' } },
            400
          );
        }

        const paymentTypeRaw =
          typeof bodyObj.payment_type === 'string' ? bodyObj.payment_type.trim().toLowerCase() : '';
        if (paymentTypeRaw && !SALARY_PAYMENT_TYPES.has(paymentTypeRaw)) {
          return jsonResponse(
            {
              ok: false,
              error: {
                code: 'BAD_REQUEST',
                message: 'payment_type must be salary | advance | bonus | partial',
              },
            },
            400
          );
        }

        let q = supabase
          .from('salary_payments')
          .select(
            'id, amount, payment_date, payment_type, note, employee_id, employees(full_name, designation, total_salary, official_salary, is_active)'
          )
          .gte('payment_date', start)
          .lte('payment_date', end)
          .order('payment_date', { ascending: false })
          .limit(limit);
        if (employeeId) q = q.eq('employee_id', employeeId);
        if (paymentTypeRaw) q = q.eq('payment_type', paymentTypeRaw);

        const { data, error } = await q;
        if (error) throw new Error(error.message);

        const rows = (data ?? []).map((raw) => {
          const row = raw as {
            id: string;
            amount: number | string | null;
            payment_date: string;
            payment_type: string;
            note: string | null;
            employee_id: string;
            employees: unknown;
          };
          const emb = Array.isArray(row.employees) ? row.employees[0] : row.employees;
          const emp =
            emb && typeof emb === 'object'
              ? (emb as {
                  full_name?: string;
                  designation?: string;
                  total_salary?: number | string | null;
                  official_salary?: number | string | null;
                  is_active?: boolean;
                })
              : null;
          return {
            id: row.id,
            employee_id: row.employee_id,
            employee_name: emp?.full_name ?? null,
            designation: emp?.designation ?? null,
            employee_total_salary: emp != null ? num(emp.total_salary) : null,
            employee_official_salary: emp != null ? num(emp.official_salary) : null,
            amount: round2(num(row.amount)),
            payment_date: String(row.payment_date).slice(0, 10),
            payment_type: row.payment_type,
            note: row.note ?? '',
          };
        });

        return jsonResponse({
          ok: true,
          data: {
            start_date: start,
            end_date: end,
            currency: 'AZN',
            rows,
          },
        });
      }

      case 'get_salaries_summary': {
        const denied = requireCapability(capabilities, 'salaries_read');
        if (denied) return denied;
        const start = asDate(bodyObj.start_date, 'start_date');
        if (start instanceof Response) return start;
        const end = asDate(bodyObj.end_date ?? bodyObj.start_date, 'end_date');
        if (end instanceof Response) return end;
        const rangeErr = assertRange(start, end);
        if (rangeErr) return rangeErr;

        type PayRow = {
          amount: number | string | null;
          payment_date: string;
          payment_type: string;
          employee_id: string;
          employees: unknown;
        };

        const payments = await fetchAllPages<PayRow>((from, to) =>
          supabase
            .from('salary_payments')
            .select('amount, payment_date, payment_type, employee_id, employees(full_name)')
            .gte('payment_date', start)
            .lte('payment_date', end)
            .range(from, to) as PromiseLike<{
            data: PayRow[] | null;
            error: { message: string } | null;
          }>
        );

        const byType = new Map<string, { payment_type: string; total: number; count: number }>();
        const byMonth = new Map<
          string,
          { year_month: string; total: number; count: number; by_type: Map<string, number> }
        >();
        const byEmployee = new Map<
          string,
          { employee_id: string; employee_name: string; total: number; count: number }
        >();
        let grand = 0;

        for (const row of payments) {
          const amount = num(row.amount);
          grand += amount;
          const ptype = String(row.payment_type || 'salary').toLowerCase();
          const ymd = String(row.payment_date).slice(0, 10);
          const ym = ymd.slice(0, 7);
          const emb = Array.isArray(row.employees) ? row.employees[0] : row.employees;
          const empName =
            emb && typeof emb === 'object' && 'full_name' in emb
              ? String((emb as { full_name?: string }).full_name ?? 'Unknown')
              : 'Unknown';

          const typePrev = byType.get(ptype);
          if (typePrev) {
            typePrev.total += amount;
            typePrev.count += 1;
          } else {
            byType.set(ptype, { payment_type: ptype, total: amount, count: 1 });
          }

          let month = byMonth.get(ym);
          if (!month) {
            month = { year_month: ym, total: 0, count: 0, by_type: new Map() };
            byMonth.set(ym, month);
          }
          month.total += amount;
          month.count += 1;
          month.by_type.set(ptype, (month.by_type.get(ptype) ?? 0) + amount);

          const empPrev = byEmployee.get(row.employee_id);
          if (empPrev) {
            empPrev.total += amount;
            empPrev.count += 1;
          } else {
            byEmployee.set(row.employee_id, {
              employee_id: row.employee_id,
              employee_name: empName,
              total: amount,
              count: 1,
            });
          }
        }

        const { data: rosterRows, error: rosterErr } = await supabase
          .from('employees')
          .select('id, full_name, designation, total_salary, official_salary, is_active, left_at')
          .order('full_name');
        if (rosterErr) throw new Error(rosterErr.message);

        const roster = (rosterRows ?? []).map((e) => ({
          id: e.id as string,
          full_name: String((e as { full_name?: string }).full_name ?? ''),
          designation: String((e as { designation?: string }).designation ?? ''),
          total_salary: round2(num((e as { total_salary?: number | string | null }).total_salary)),
          official_salary: round2(
            num((e as { official_salary?: number | string | null }).official_salary)
          ),
          is_active: Boolean((e as { is_active?: boolean }).is_active),
          left_at: (e as { left_at?: string | null }).left_at
            ? String((e as { left_at?: string | null }).left_at).slice(0, 10)
            : null,
        }));
        const activeRoster = roster.filter((e) => e.is_active);
        const committedTotal = activeRoster.reduce((s, e) => s + e.total_salary, 0);
        const committedOfficial = activeRoster.reduce((s, e) => s + e.official_salary, 0);

        return jsonResponse({
          ok: true,
          data: {
            start_date: start,
            end_date: end,
            currency: 'AZN',
            note:
              'Totals are cash paid from salary_payments (not accrued duty). Pair with get_sales_summary for salary % of revenue. roster.committed_* are active employees’ monthly rates, not period cash out.',
            total: round2(grand),
            row_count: payments.length,
            by_payment_type: [...byType.values()]
              .map((t) => ({
                payment_type: t.payment_type,
                total: round2(t.total),
                count: t.count,
                percent_of_total: grand > 0 ? Math.round((t.total / grand) * 1000) / 10 : 0,
              }))
              .sort((a, b) => b.total - a.total),
            by_month: [...byMonth.values()]
              .map((m) => ({
                year_month: m.year_month,
                total: round2(m.total),
                count: m.count,
                by_payment_type: [...m.by_type.entries()]
                  .map(([payment_type, total]) => ({
                    payment_type,
                    total: round2(total),
                  }))
                  .sort((a, b) => b.total - a.total),
              }))
              .sort((a, b) => a.year_month.localeCompare(b.year_month)),
            by_employee: [...byEmployee.values()]
              .map((e) => ({
                employee_id: e.employee_id,
                employee_name: e.employee_name,
                total: round2(e.total),
                count: e.count,
              }))
              .sort((a, b) => b.total - a.total),
            roster: {
              active_count: activeRoster.length,
              total_count: roster.length,
              committed_monthly_total_salary: round2(committedTotal),
              committed_monthly_official_salary: round2(committedOfficial),
              employees: roster,
            },
          },
        });
      }

      case 'create_purchase': {
        const denied = requireCapability(capabilities, 'purchases_write');
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

        const replay = await findIdempotentPurchaseCreate(supabase, idempotencyKey);
        if (replay) {
          return jsonResponse({ ok: true, data: { ...replay, idempotent_replay: true } });
        }

        const item = await resolveExpenseItemForPurchase(supabase, bodyObj);
        if (item instanceof Response) return item;
        const supplier = await resolveOrCreateSupplier(supabase, bodyObj);
        if (supplier instanceof Response) return supplier;

        const quantityRaw = num(bodyObj.quantity);
        const unitCostRaw = num(bodyObj.unit_cost);
        let discountPercent =
          bodyObj.discount_percent === undefined || bodyObj.discount_percent === null
            ? 0
            : num(bodyObj.discount_percent);

        if (!(quantityRaw > 0) || quantityRaw > MAX_AMOUNT) {
          return jsonResponse(
            {
              ok: false,
              error: { code: 'BAD_REQUEST', message: 'quantity must be > 0' },
            },
            400
          );
        }
        if (!(unitCostRaw >= 0) || unitCostRaw > MAX_AMOUNT) {
          return jsonResponse(
            {
              ok: false,
              error: { code: 'BAD_REQUEST', message: 'unit_cost must be >= 0' },
            },
            400
          );
        }
        if (!(discountPercent >= 0) || discountPercent > 100) {
          return jsonResponse(
            {
              ok: false,
              error: { code: 'BAD_REQUEST', message: 'discount_percent must be 0–100' },
            },
            400
          );
        }

        const quantity = roundFinanceMoney(quantityRaw);
        const unitCost = roundFinanceMoney(unitCostRaw);
        discountPercent = roundFinanceMoney(discountPercent);
        const totalCost = computePurchaseTotalCost(quantity, unitCost, discountPercent);

        if (bodyObj.invoice_total !== undefined && bodyObj.invoice_total !== null) {
          const invoiceTotal = num(bodyObj.invoice_total);
          if (Math.abs(invoiceTotal - totalCost) > INVOICE_TOTAL_TOLERANCE) {
            return jsonResponse(
              {
                ok: false,
                error: {
                  code: 'BAD_REQUEST',
                  message: `invoice_total ${invoiceTotal} does not match computed total_cost ${totalCost} (tolerance ${INVOICE_TOTAL_TOLERANCE} AZN)`,
                  computed_total_cost: totalCost,
                },
              },
              400
            );
          }
        }

        const purchaseDate = asDate(bodyObj.purchase_date, 'purchase_date');
        if (purchaseDate instanceof Response) return purchaseDate;
        const futureErr = assertNotFutureDate(purchaseDate, 'purchase_date');
        if (futureErr) return futureErr;
        const ageErr = assertExpenseDateMutable(purchaseDate);
        if (ageErr) return ageErr;

        const payment =
          typeof bodyObj.payment === 'string' ? bodyObj.payment.trim().toLowerCase() : '';
        if (payment !== 'on_account' && payment !== 'paid') {
          return jsonResponse(
            {
              ok: false,
              error: {
                code: 'BAD_REQUEST',
                message: 'payment must be on_account | paid',
              },
            },
            400
          );
        }

        const isOnCredit = payment === 'on_account';
        const credit = purchaseCreditFields(isOnCredit);
        let paymentMethod: string | null = null;
        if (!isOnCredit) {
          const pm =
            typeof bodyObj.payment_method === 'string'
              ? bodyObj.payment_method.trim().toLowerCase()
              : 'cash';
          if (!PAYMENT_METHODS.has(pm)) {
            return jsonResponse(
              {
                ok: false,
                error: {
                  code: 'BAD_REQUEST',
                  message: 'payment_method must be cash | card | bank_transfer when payment=paid',
                },
              },
              400
            );
          }
          paymentMethod = pm;
        }

        const notesRaw = typeof bodyObj.notes === 'string' ? bodyObj.notes.trim() : '';
        if (notesRaw.length > MAX_DESCRIPTION_LEN) {
          return jsonResponse(
            {
              ok: false,
              error: {
                code: 'BAD_REQUEST',
                message: `notes must be <= ${MAX_DESCRIPTION_LEN} characters`,
              },
            },
            400
          );
        }

        const rowPayload = {
          expense_item_id: item.id,
          master_category_id: item.master_category_id,
          supplier_id: supplier.id,
          quantity,
          unit_cost: unitCost,
          discount_percent: discountPercent,
          total_cost: totalCost,
          purchase_date: purchaseDate,
          notes: notesRaw,
          payment_method: paymentMethod,
          ...credit,
        };

        const { data, error } = await supabase
          .from('purchases')
          .insert(rowPayload)
          .select(PURCHASE_SELECT)
          .single();
        if (error) throw new Error(error.message);

        await writeAdminAudit(supabase, {
          actorId: null,
          actorRole: 'agent',
          action: 'insert',
          resourceTable: 'purchases',
          resourceId: data.id,
          payload: {
            ...rowPayload,
            idempotency_key: idempotencyKey,
            expense_item_name: item.name,
            supplier_name: supplier.name,
            supplier_created: supplier.created,
            payment,
          },
        });

        return jsonResponse({
          ok: true,
          data: {
            ...data,
            expense_item_name: item.name,
            supplier_name: supplier.name,
            supplier_created: supplier.created,
            payment,
          },
        });
      }

      case 'create_sale': {
        const denied = requireCapability(capabilities, 'sales_write');
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

        const replay = await findIdempotentSaleCreate(supabase, idempotencyKey);
        if (replay) {
          return jsonResponse({ ok: true, data: { ...replay, idempotent_replay: true } });
        }

        const channel = await resolvePartnerChannel(supabase, bodyObj);
        if (channel instanceof Response) return channel;

        const totalPrice = parseSaleTotal(bodyObj.total_price);
        if (totalPrice instanceof Response) return totalPrice;
        const quantity = parseSaleQuantity(bodyObj.quantity ?? 1);
        if (quantity instanceof Response) return quantity;
        const saleDate = asDate(bodyObj.sale_date, 'sale_date');
        if (saleDate instanceof Response) return saleDate;
        const futureErr = assertNotFutureDate(saleDate, 'sale_date');
        if (futureErr) return futureErr;
        const ageErr = assertExpenseDateMutable(saleDate);
        if (ageErr) return ageErr;

        const notesRaw = typeof bodyObj.notes === 'string' ? bodyObj.notes : '';
        if (notesRaw.length > MAX_DESCRIPTION_LEN) {
          return jsonResponse(
            {
              ok: false,
              error: {
                code: 'BAD_REQUEST',
                message: `notes must be <= ${MAX_DESCRIPTION_LEN} characters`,
              },
            },
            400
          );
        }

        const unitPrice = totalPrice / quantity;
        const candidatePayload: Json = {
          total_price: totalPrice,
          quantity,
          unit_price: unitPrice,
          sales_channel_id: channel.id,
          notes: notesRaw,
          sale_date: saleDate,
          source: 'manual',
        };

        const guard = assertSalesMutationAllowed('manager', 'insert', null, candidatePayload);
        if (!guard.ok) {
          return jsonResponse(
            { ok: false, error: { code: 'FORBIDDEN', message: guard.message } },
            403
          );
        }
        const rowPayload = {
          ...(guard.sanitizedPayload ?? {}),
          created_by: null,
        };

        const { data, error } = await supabase
          .from('sales')
          .insert(rowPayload)
          .select(SALE_SELECT)
          .single();
        if (error) throw new Error(error.message);

        await writeAdminAudit(supabase, {
          actorId: null,
          actorRole: 'agent',
          action: 'insert',
          resourceTable: 'sales',
          resourceId: data.id,
          payload: {
            ...rowPayload,
            channel_name: channel.name,
            idempotency_key: idempotencyKey,
          },
        });

        return jsonResponse({ ok: true, data });
      }

      case 'update_sale': {
        const denied = requireCapability(capabilities, 'sales_write');
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
          .from('sales')
          .select('id, source, sale_date, total_price, quantity, unit_price, sales_channel_id, notes, online_payment_method, payment_method')
          .eq('id', id)
          .maybeSingle();
        if (existingErr) throw new Error(existingErr.message);
        if (!existing) {
          return jsonResponse({ ok: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } }, 404);
        }

        const existingAgeErr = assertExpenseDateMutable(String(existing.sale_date).slice(0, 10));
        if (existingAgeErr) return existingAgeErr;

        const patch: Json = {};
        let nextTotal = num(existing.total_price);
        let nextQty = Math.max(1, Math.floor(num(existing.quantity)) || 1);

        if (bodyObj.total_price !== undefined) {
          const totalPrice = parseSaleTotal(bodyObj.total_price);
          if (totalPrice instanceof Response) return totalPrice;
          nextTotal = totalPrice;
          patch.total_price = totalPrice;
        }
        if (bodyObj.quantity !== undefined) {
          const quantity = parseSaleQuantity(bodyObj.quantity);
          if (quantity instanceof Response) return quantity;
          nextQty = quantity;
          patch.quantity = quantity;
        }
        if (bodyObj.total_price !== undefined || bodyObj.quantity !== undefined) {
          patch.unit_price = nextTotal / nextQty;
        }
        if (bodyObj.sale_date !== undefined) {
          const saleDate = asDate(bodyObj.sale_date, 'sale_date');
          if (saleDate instanceof Response) return saleDate;
          const futureErr = assertNotFutureDate(saleDate, 'sale_date');
          if (futureErr) return futureErr;
          const ageErr = assertExpenseDateMutable(saleDate);
          if (ageErr) return ageErr;
          patch.sale_date = saleDate;
        }
        if (bodyObj.notes !== undefined) {
          const notes = String(bodyObj.notes);
          if (notes.length > MAX_DESCRIPTION_LEN) {
            return jsonResponse(
              {
                ok: false,
                error: {
                  code: 'BAD_REQUEST',
                  message: `notes must be <= ${MAX_DESCRIPTION_LEN} characters`,
                },
              },
              400
            );
          }
          patch.notes = notes;
        }

        if (
          bodyObj.sales_channel_id !== undefined ||
          bodyObj.channel !== undefined ||
          bodyObj.channel_name !== undefined
        ) {
          const channel = await resolvePartnerChannel(supabase, bodyObj);
          if (channel instanceof Response) return channel;
          patch.sales_channel_id = channel.id;
        }

        if (Object.keys(patch).length === 0) {
          return jsonResponse(
            { ok: false, error: { code: 'BAD_REQUEST', message: 'No fields to update' } },
            400
          );
        }

        const guard = assertSalesMutationAllowed(
          'manager',
          'update',
          {
            id: existing.id,
            source: existing.source,
            online_payment_method: existing.online_payment_method,
            payment_method: existing.payment_method,
          },
          patch
        );
        if (!guard.ok) {
          return jsonResponse(
            { ok: false, error: { code: 'FORBIDDEN', message: guard.message } },
            403
          );
        }
        const sanitized = guard.sanitizedPayload ?? {};

        const { data, error } = await supabase
          .from('sales')
          .update(sanitized)
          .eq('id', id)
          .select(SALE_SELECT)
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) {
          return jsonResponse({ ok: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } }, 404);
        }

        await writeAdminAudit(supabase, {
          actorId: null,
          actorRole: 'agent',
          action: 'update',
          resourceTable: 'sales',
          resourceId: id,
          payload: sanitized,
        });

        return jsonResponse({ ok: true, data });
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
