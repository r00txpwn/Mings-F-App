import { applyAnalyticsSourceFilter } from '../../lib/analyticsSourceFilter';
import { supabase } from '../../lib/supabase';
import type {
  AnalyticsServiceResponse,
  ChannelPerformance,
  ChannelPerformanceParams,
  DashboardOperationalData,
  ExpenseBreakdownData,
  ExpenseBreakdownItem,
  ExpenseBreakdownParams,
  HourlyDemandPoint,
  OrderSourceMixItem,
  PaymentHealthStats,
  PayoutReconciliationParams,
  PayoutReconciliationSummary,
  PeriodSummary,
  PeriodSummaryParams,
  PrepTimeStats,
  ReconciliationStatus,
  RevenueCostTrendParams,
  RevenueCostTrendPoint,
  TopProductItem,
  TrendGranularity,
} from '../../types/analytics';

type SaleRow = {
  id?: string;
  sale_date: string;
  total_price: number | string | null;
  quantity: number | string | null;
  sales_channel_id: string | null;
  source?: string | null;
  discount_amount?: number | string | null;
  payment_status?: string | null;
  online_payment_method?: string | null;
  prep_started_at?: string | null;
  ready_at?: string | null;
  estimated_ready_at?: string | null;
};

type ExpenseRow = {
  amount: number | string | null;
  expense_date: string;
  master_category_id: string | null;
  expense_item_id: string | null;
  master_categories?: { name: string | null; color: string | null } | { name: string | null; color: string | null }[] | null;
  expense_items?: { name: string | null } | { name: string | null }[] | null;
};

type PurchaseRow = {
  total_cost: number | string | null;
  purchase_date: string;
  master_category_id: string | null;
  expense_item_id: string | null;
  master_categories?: { name: string | null; color: string | null } | { name: string | null; color: string | null }[] | null;
  expense_items?: { name: string | null } | { name: string | null }[] | null;
};

type PayoutRow = {
  id: string;
  sales_channel_id: string;
  period_start: string;
  period_end: string;
  payout_amount: number | string | null;
  payout_date: string;
  sales_channels?: { name: string | null } | { name: string | null }[] | null;
};

type SalesChannelRow = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  logo_url: string | null;
  is_active: boolean;
};

const UNKNOWN_CATEGORY = 'Uncategorized';
const UNKNOWN_ITEM = 'Unspecified';
const UNKNOWN_CHANNEL = 'Unknown';

const toIsoDate = (value: string): string => value.split('T')[0];
const safeNumber = (value: number | string | null | undefined): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

const formatBucket = (dateValue: string, granularity: TrendGranularity): string => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return toIsoDate(dateValue);

  if (granularity === 'month') {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  if (granularity === 'week') {
    return toIsoDate(getWeekStart(date).toISOString());
  }
  return toIsoDate(date.toISOString());
};

const buildOverlapFilter = (startDate: string, endDate: string): string =>
  `and(period_start.gte.${startDate},period_start.lte.${endDate}),and(period_end.gte.${startDate},period_end.lte.${endDate}),and(period_start.lte.${startDate},period_end.gte.${endDate})`;

export function getPreviousPeriodRange(startDate: string, endDate: string): { startDate: string; endDate: string } {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const dayMs = 86400000;
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs) + 1);
  const prevEnd = new Date(start.getTime() - dayMs);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * dayMs);
  return { startDate: toIsoDate(prevStart.toISOString()), endDate: toIsoDate(prevEnd.toISOString()) };
}

const pickSingle = <T>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

export async function fetchRevenueCostTrend(
  params: RevenueCostTrendParams
): Promise<AnalyticsServiceResponse<RevenueCostTrendPoint[]>> {
  const granularity = params.granularity ?? 'day';

  let salesQuery = supabase
    .from('sales')
    .select('id, sale_date, total_price, quantity')
    .gte('sale_date', params.startDate)
    .lte('sale_date', `${params.endDate}T23:59:59`);

  salesQuery = applyAnalyticsSourceFilter(salesQuery, params.source);

  const [salesRes, opexRes, purchasesRes] = await Promise.all([
    salesQuery,
    supabase
      .from('operational_expenses')
      .select('expense_date, amount')
      .gte('expense_date', params.startDate)
      .lte('expense_date', params.endDate),
    supabase
      .from('purchases')
      .select('purchase_date, total_cost')
      .gte('purchase_date', params.startDate)
      .lte('purchase_date', params.endDate),
  ]);

  const firstError = salesRes.error ?? opexRes.error ?? purchasesRes.error;
  if (firstError) {
    return { data: null, error: firstError.message };
  }

  const buckets = new Map<string, RevenueCostTrendPoint>();
  const orderIdsByBucket = new Map<string, Set<string>>();
  const getOrCreate = (bucket: string): RevenueCostTrendPoint => {
    const existing = buckets.get(bucket);
    if (existing) return existing;
    const next: RevenueCostTrendPoint = {
      bucket,
      revenue: 0,
      operationalExpense: 0,
      purchaseCost: 0,
      net: 0,
      orders: 0,
    };
    buckets.set(bucket, next);
    return next;
  };

  for (const row of (salesRes.data ?? []) as SaleRow[]) {
    const bucket = formatBucket(row.sale_date, granularity);
    const point = getOrCreate(bucket);
    point.revenue += safeNumber(row.total_price);
    if (row.id) {
      const ids = orderIdsByBucket.get(bucket) ?? new Set<string>();
      ids.add(row.id);
      orderIdsByBucket.set(bucket, ids);
      point.orders = ids.size;
    } else {
      point.orders += 1;
    }
  }

  for (const row of (opexRes.data ?? []) as Pick<ExpenseRow, 'expense_date' | 'amount'>[]) {
    const point = getOrCreate(formatBucket(row.expense_date, granularity));
    point.operationalExpense += safeNumber(row.amount);
  }

  for (const row of (purchasesRes.data ?? []) as Pick<PurchaseRow, 'purchase_date' | 'total_cost'>[]) {
    const point = getOrCreate(formatBucket(row.purchase_date, granularity));
    point.purchaseCost += safeNumber(row.total_cost);
  }

  const data = [...buckets.values()]
    .map((point) => ({
      ...point,
      net: point.revenue - point.operationalExpense - point.purchaseCost,
    }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));

  return { data, error: null };
}

export async function fetchExpenseBreakdown(
  params: ExpenseBreakdownParams
): Promise<AnalyticsServiceResponse<ExpenseBreakdownData>> {
  const scope = params.scope ?? 'all';
  const includeOperational = scope === 'all' || scope === 'operational';
  const includePurchases = scope === 'all' || scope === 'purchases';

  const [opexRes, purchasesRes] = await Promise.all([
    includeOperational
      ? supabase
          .from('operational_expenses')
          .select('amount, expense_date, master_category_id, expense_item_id, master_categories(name, color), expense_items(name)')
          .gte('expense_date', params.startDate)
          .lte('expense_date', params.endDate)
      : Promise.resolve({ data: [], error: null }),
    includePurchases
      ? supabase
          .from('purchases')
          .select('total_cost, purchase_date, master_category_id, expense_item_id, master_categories(name, color), expense_items(name)')
          .gte('purchase_date', params.startDate)
          .lte('purchase_date', params.endDate)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const firstError = opexRes.error ?? purchasesRes.error;
  if (firstError) {
    return { data: null, error: firstError.message };
  }

  const grouped = new Map<string, ExpenseBreakdownItem>();
  const upsert = (item: ExpenseBreakdownItem, amount: number): void => {
    const key = `${item.scope}::${item.categoryId ?? 'null'}::${item.expenseItemId ?? 'null'}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.total += amount;
      existing.count += 1;
      return;
    }
    grouped.set(key, { ...item, total: amount, count: 1 });
  };

  let operationalTotal = 0;
  for (const row of (opexRes.data ?? []) as ExpenseRow[]) {
    const amount = safeNumber(row.amount);
    operationalTotal += amount;
    upsert(
      {
        scope: 'operational',
        categoryId: row.master_category_id,
        categoryName: pickSingle(row.master_categories)?.name ?? UNKNOWN_CATEGORY,
        categoryColor: pickSingle(row.master_categories)?.color ?? '#9CA3AF',
        expenseItemId: row.expense_item_id,
        expenseItemName: pickSingle(row.expense_items)?.name ?? UNKNOWN_ITEM,
        total: 0,
        count: 0,
      },
      amount
    );
  }

  let purchasesTotal = 0;
  for (const row of (purchasesRes.data ?? []) as PurchaseRow[]) {
    const amount = safeNumber(row.total_cost);
    purchasesTotal += amount;
    upsert(
      {
        scope: 'purchases',
        categoryId: row.master_category_id,
        categoryName: pickSingle(row.master_categories)?.name ?? UNKNOWN_CATEGORY,
        categoryColor: pickSingle(row.master_categories)?.color ?? '#9CA3AF',
        expenseItemId: row.expense_item_id,
        expenseItemName: pickSingle(row.expense_items)?.name ?? UNKNOWN_ITEM,
        total: 0,
        count: 0,
      },
      amount
    );
  }

  return {
    data: {
      items: [...grouped.values()].sort((a, b) => b.total - a.total),
      totals: {
        operational: operationalTotal,
        purchases: purchasesTotal,
        overall: operationalTotal + purchasesTotal,
      },
    },
    error: null,
  };
}

export async function fetchPayoutReconciliation(
  params: PayoutReconciliationParams
): Promise<AnalyticsServiceResponse<PayoutReconciliationSummary>> {
  let payoutsQuery = supabase
    .from('platform_payouts')
    .select('id, sales_channel_id, period_start, period_end, payout_amount, payout_date, sales_channels(name)')
    .or(buildOverlapFilter(params.startDate, params.endDate))
    .order('payout_date', { ascending: false });

  if (params.channelIds && params.channelIds.length > 0) {
    payoutsQuery = payoutsQuery.in('sales_channel_id', params.channelIds);
  }

  const payoutsRes = await payoutsQuery;
  if (payoutsRes.error) {
    return { data: null, error: payoutsRes.error.message };
  }

  const payouts = (payoutsRes.data ?? []) as PayoutRow[];
  if (payouts.length === 0) {
    return {
      data: {
        totalExpected: 0,
        totalActual: 0,
        totalDifference: 0,
        matchedCount: 0,
        mismatchedCount: 0,
        pendingCount: 0,
        items: [],
      },
      error: null,
    };
  }

  const minStart = payouts.reduce(
    (min, p) => (p.period_start < min ? p.period_start : min),
    payouts[0].period_start
  );
  const maxEnd = payouts.reduce(
    (max, p) => (p.period_end > max ? p.period_end : max),
    payouts[0].period_end
  );

  let salesQuery = supabase
    .from('sales')
    .select('sale_date, total_price, sales_channel_id')
    .gte('sale_date', minStart)
    .lte('sale_date', `${maxEnd}T23:59:59`);

  if (params.channelIds && params.channelIds.length > 0) {
    salesQuery = salesQuery.in('sales_channel_id', params.channelIds);
  }

  const salesRes = await salesQuery;
  if (salesRes.error) {
    return { data: null, error: salesRes.error.message };
  }

  const salesRows = (salesRes.data ?? []) as SaleRow[];
  const items = payouts.map((payout) => {
    const grossSales = salesRows
      .filter((sale) => {
        const saleDate = toIsoDate(sale.sale_date);
        return (
          sale.sales_channel_id === payout.sales_channel_id &&
          saleDate >= payout.period_start &&
          saleDate <= payout.period_end
        );
      })
      .reduce((sum, sale) => sum + safeNumber(sale.total_price), 0);

    const payoutAmount = safeNumber(payout.payout_amount);
    const expectedAmount = grossSales;
    const actualAmount = payoutAmount;
    const difference = actualAmount - expectedAmount;
    const absDiff = Math.abs(difference);
    const threshold = Math.max(1, expectedAmount * 0.001);
    const status: ReconciliationStatus = actualAmount <= 0
      ? 'pending'
      : absDiff <= threshold
      ? 'matched'
      : difference < 0
      ? 'underpaid'
      : 'overpaid';

    return {
      payoutId: payout.id,
      provider: pickSingle(payout.sales_channels)?.name ?? UNKNOWN_CHANNEL,
      expectedAmount,
      actualAmount,
      difference,
      status,
      settledAt: payout.payout_date || null,
    };
  });

  const totalExpected = items.reduce((sum, item) => sum + item.expectedAmount, 0);
  const totalActual = items.reduce((sum, item) => sum + item.actualAmount, 0);
  const pendingCount = items.filter((item) => item.status === 'pending').length;
  const matchedCount = items.filter((item) => item.status === 'matched').length;
  const mismatchedCount = items.length - matchedCount - pendingCount;

  return {
    data: {
      totalExpected,
      totalActual,
      totalDifference: totalActual - totalExpected,
      matchedCount,
      mismatchedCount,
      pendingCount,
      items,
    },
    error: null,
  };
}

export async function fetchChannelPerformance(
  params: ChannelPerformanceParams
): Promise<AnalyticsServiceResponse<ChannelPerformance[]>> {
  let channelsQuery = supabase.from('sales_channels').select('id, name, icon, color, logo_url, is_active').eq('is_deleted', false);
  if (!params.includeInactiveChannels) {
    channelsQuery = channelsQuery.eq('is_active', true);
  }

  let salesQuery = supabase
    .from('sales')
    .select('id, sales_channel_id, total_price, quantity, sale_date')
    .gte('sale_date', params.startDate)
    .lte('sale_date', `${params.endDate}T23:59:59`);

  salesQuery = applyAnalyticsSourceFilter(salesQuery, params.source);

  const [channelsRes, salesRes] = await Promise.all([channelsQuery, salesQuery]);
  const firstError = channelsRes.error ?? salesRes.error;
  if (firstError) {
    return { data: null, error: firstError.message };
  }

  const channels = (channelsRes.data ?? []) as SalesChannelRow[];
  const sales = (salesRes.data ?? []) as SaleRow[];
  const channelById = new Map(channels.map((c) => [c.id, c]));

  const performance = new Map<string, ChannelPerformance>();
  const orderIdsByChannel = new Map<string, Set<string>>();
  const ensure = (channelId: string | null): ChannelPerformance => {
    const key = channelId ?? 'unknown';
    const existing = performance.get(key);
    if (existing) return existing;

    const channel = channelId ? channelById.get(channelId) : undefined;
    const next: ChannelPerformance = {
      channelId: channelId ?? 'unknown',
      channelName: channel?.name ?? UNKNOWN_CHANNEL,
      grossSales: 0,
      netRevenue: 0,
      orderCount: 0,
      avgOrderValue: 0,
    };
    performance.set(key, next);
    return next;
  };

  for (const sale of sales) {
    const item = ensure(sale.sales_channel_id);
    item.grossSales += safeNumber(sale.total_price);
    const channelKey = sale.sales_channel_id ?? 'unknown';
    if (sale.id) {
      const ids = orderIdsByChannel.get(channelKey) ?? new Set<string>();
      ids.add(sale.id);
      orderIdsByChannel.set(channelKey, ids);
      item.orderCount = ids.size;
    } else {
      item.orderCount += 1;
    }
  }

  // Keep visible channels in output even with zero sales.
  for (const channel of channels) {
    ensure(channel.id);
  }

  const totalRevenue = [...performance.values()].reduce((sum, item) => sum + item.grossSales, 0);
  const data = [...performance.values()]
    .map((item) => {
      const revenueSharePct = totalRevenue > 0 ? (item.grossSales / totalRevenue) * 100 : 0;
      return {
        ...item,
        netRevenue: item.grossSales,
        avgOrderValue: item.orderCount > 0 ? item.grossSales / item.orderCount : 0,
        revenueSharePct,
        grossMarginPct: revenueSharePct,
      };
    })
    .sort((a, b) => b.grossSales - a.grossSales);

  return { data, error: null };
}

export async function fetchPeriodSummary(
  params: PeriodSummaryParams,
): Promise<AnalyticsServiceResponse<PeriodSummary>> {
  let salesQuery = supabase
    .from('sales')
    .select('id, total_price, discount_amount')
    .gte('sale_date', params.startDate)
    .lte('sale_date', `${params.endDate}T23:59:59`);

  salesQuery = applyAnalyticsSourceFilter(salesQuery, params.source);

  const [salesRes, opexRes, purchasesRes, withdrawalsRes] = await Promise.all([
    salesQuery,
    supabase
      .from('operational_expenses')
      .select('amount')
      .gte('expense_date', params.startDate)
      .lte('expense_date', params.endDate),
    supabase
      .from('purchases')
      .select('total_cost')
      .gte('purchase_date', params.startDate)
      .lte('purchase_date', params.endDate),
    supabase
      .from('bank_withdrawals')
      .select('fee_amount')
      .gte('withdrawal_date', params.startDate)
      .lte('withdrawal_date', params.endDate),
  ]);

  const firstError = salesRes.error ?? opexRes.error ?? purchasesRes.error;
  if (firstError) {
    return { data: null, error: firstError.message };
  }

  const sales = (salesRes.data ?? []) as SaleRow[];
  const orderIds = new Set<string>();
  let grossSales = 0;
  let discounts = 0;

  for (const row of sales) {
    grossSales += safeNumber(row.total_price);
    discounts += safeNumber(row.discount_amount);
    if (row.id) {
      orderIds.add(row.id);
    }
  }

  const opex = ((opexRes.data ?? []) as Pick<ExpenseRow, 'amount'>[]).reduce(
    (sum, row) => sum + safeNumber(row.amount),
    0,
  );
  const cogs = ((purchasesRes.data ?? []) as Pick<PurchaseRow, 'total_cost'>[]).reduce(
    (sum, row) => sum + safeNumber(row.total_cost),
    0,
  );
  const bankFees =
    withdrawalsRes.error || !withdrawalsRes.data
      ? 0
      : (withdrawalsRes.data as { fee_amount: number | string | null }[]).reduce(
          (sum, row) => sum + safeNumber(row.fee_amount),
          0,
        );

  return {
    data: {
      grossSales,
      discounts,
      refunds: 0,
      tips: 0,
      orderCount: orderIds.size > 0 ? orderIds.size : sales.length,
      cogs,
      opex,
      bankFees,
    },
    error: null,
  };
}

export async function fetchOrderSourceMix(
  params: PeriodSummaryParams,
): Promise<AnalyticsServiceResponse<OrderSourceMixItem[]>> {
  let salesQuery = supabase
    .from('sales')
    .select('id, source, total_price')
    .gte('sale_date', params.startDate)
    .lte('sale_date', `${params.endDate}T23:59:59`);

  salesQuery = applyAnalyticsSourceFilter(salesQuery, params.source);

  const salesRes = await salesQuery;
  if (salesRes.error) {
    return { data: null, error: salesRes.error.message };
  }

  const grouped = new Map<string, { orderIds: Set<string>; revenue: number }>();
  for (const row of (salesRes.data ?? []) as SaleRow[]) {
    const source = row.source ?? 'manual';
    const entry = grouped.get(source) ?? { orderIds: new Set<string>(), revenue: 0 };
    if (row.id) entry.orderIds.add(row.id);
    entry.revenue += safeNumber(row.total_price);
    grouped.set(source, entry);
  }

  const totalOrders = [...grouped.values()].reduce((sum, item) => sum + item.orderIds.size, 0);
  const data = [...grouped.entries()]
    .map(([source, item]) => ({
      source,
      orderCount: item.orderIds.size,
      revenue: item.revenue,
      sharePct: totalOrders > 0 ? (item.orderIds.size / totalOrders) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return { data, error: null };
}

export async function fetchTopProducts(
  params: PeriodSummaryParams,
  limit = 8,
): Promise<AnalyticsServiceResponse<TopProductItem[]>> {
  let salesQuery = supabase
    .from('sales')
    .select('id')
    .gte('sale_date', params.startDate)
    .lte('sale_date', `${params.endDate}T23:59:59`);

  salesQuery = applyAnalyticsSourceFilter(salesQuery, params.source);
  const salesRes = await salesQuery;
  if (salesRes.error) {
    return { data: null, error: salesRes.error.message };
  }

  const saleIds = ((salesRes.data ?? []) as Pick<SaleRow, 'id'>[])
    .map((row) => row.id)
    .filter((id): id is string => Boolean(id));

  if (saleIds.length === 0) {
    return { data: [], error: null };
  }

  const itemsRes = await supabase
    .from('sale_items')
    .select('product_name, quantity, total_price')
    .in('sale_id', saleIds.slice(0, 500));

  if (itemsRes.error) {
    return { data: null, error: itemsRes.error.message };
  }

  const grouped = new Map<string, { quantity: number; revenue: number }>();
  for (const row of itemsRes.data ?? []) {
    const name = String(row.product_name ?? 'Unknown');
    const entry = grouped.get(name) ?? { quantity: 0, revenue: 0 };
    entry.quantity += safeNumber(row.quantity);
    entry.revenue += safeNumber(row.total_price);
    grouped.set(name, entry);
  }

  const data = [...grouped.entries()]
    .map(([productName, stats]) => ({
      productName,
      quantity: stats.quantity,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  return { data, error: null };
}

export async function fetchPrepTimeStats(
  params: PeriodSummaryParams,
): Promise<AnalyticsServiceResponse<PrepTimeStats>> {
  let salesQuery = supabase
    .from('sales')
    .select('id, prep_started_at, ready_at, estimated_ready_at')
    .gte('sale_date', params.startDate)
    .lte('sale_date', `${params.endDate}T23:59:59`)
    .not('prep_started_at', 'is', null)
    .not('ready_at', 'is', null);

  salesQuery = applyAnalyticsSourceFilter(salesQuery, params.source);
  const salesRes = await salesQuery;
  if (salesRes.error) {
    return { data: null, error: salesRes.error.message };
  }

  const rows = salesRes.data ?? [];
  if (rows.length === 0) {
    return {
      data: { avgPrepMinutes: null, ordersWithPrep: 0, slaMetPct: null },
      error: null,
    };
  }

  let totalMinutes = 0;
  let slaMet = 0;
  let slaEligible = 0;

  for (const row of rows) {
    const start = new Date(String(row.prep_started_at));
    const ready = new Date(String(row.ready_at));
    if (Number.isNaN(start.getTime()) || Number.isNaN(ready.getTime())) continue;
    const minutes = (ready.getTime() - start.getTime()) / 60000;
    if (minutes >= 0) {
      totalMinutes += minutes;
    }
    if (row.estimated_ready_at) {
      const estimated = new Date(String(row.estimated_ready_at));
      if (!Number.isNaN(estimated.getTime())) {
        slaEligible += 1;
        if (ready.getTime() <= estimated.getTime()) {
          slaMet += 1;
        }
      }
    }
  }

  return {
    data: {
      avgPrepMinutes: rows.length > 0 ? totalMinutes / rows.length : null,
      ordersWithPrep: rows.length,
      slaMetPct: slaEligible > 0 ? (slaMet / slaEligible) * 100 : null,
    },
    error: null,
  };
}

export async function fetchHourlyDemand(
  params: PeriodSummaryParams,
): Promise<AnalyticsServiceResponse<HourlyDemandPoint[]>> {
  let salesQuery = supabase
    .from('sales')
    .select('id, sale_date, total_price')
    .gte('sale_date', params.startDate)
    .lte('sale_date', `${params.endDate}T23:59:59`);

  salesQuery = applyAnalyticsSourceFilter(salesQuery, params.source);
  const salesRes = await salesQuery;
  if (salesRes.error) {
    return { data: null, error: salesRes.error.message };
  }

  const hourly = new Map<number, { orderIds: Set<string>; revenue: number }>();
  for (let h = 0; h < 24; h += 1) {
    hourly.set(h, { orderIds: new Set<string>(), revenue: 0 });
  }

  for (const row of (salesRes.data ?? []) as SaleRow[]) {
    const date = new Date(row.sale_date);
    if (Number.isNaN(date.getTime())) continue;
    const hour = date.getHours();
    const entry = hourly.get(hour)!;
    if (row.id) entry.orderIds.add(row.id);
    entry.revenue += safeNumber(row.total_price);
  }

  const data = [...hourly.entries()]
    .map(([hour, stats]) => ({
      hour,
      orderCount: stats.orderIds.size,
      revenue: stats.revenue,
    }))
    .sort((a, b) => a.hour - b.hour);

  return { data, error: null };
}

export async function fetchPaymentHealth(
  params: PeriodSummaryParams,
): Promise<AnalyticsServiceResponse<PaymentHealthStats>> {
  let salesQuery = supabase
    .from('sales')
    .select('id, total_price, payment_status, online_payment_method')
    .gte('sale_date', params.startDate)
    .lte('sale_date', `${params.endDate}T23:59:59`);

  salesQuery = applyAnalyticsSourceFilter(salesQuery, params.source);
  const salesRes = await salesQuery;
  if (salesRes.error) {
    return { data: null, error: salesRes.error.message };
  }

  let paidCount = 0;
  let unpaidCount = 0;
  let paidRevenue = 0;
  let unpaidRevenue = 0;
  let cardCount = 0;
  let codCount = 0;

  for (const row of (salesRes.data ?? []) as SaleRow[]) {
    const amount = safeNumber(row.total_price);
    const status = String(row.payment_status ?? '').toLowerCase();
    const method = String(row.online_payment_method ?? '').toLowerCase();

    if (status === 'paid' || status === 'completed') {
      paidCount += 1;
      paidRevenue += amount;
    } else {
      unpaidCount += 1;
      unpaidRevenue += amount;
    }

    if (method.includes('card') || method === 'epoint' || method === 'online') {
      cardCount += 1;
    } else if (method.includes('cod') || method.includes('cash')) {
      codCount += 1;
    }
  }

  return {
    data: {
      paidCount,
      unpaidCount,
      paidRevenue,
      unpaidRevenue,
      cardCount,
      codCount,
    },
    error: null,
  };
}

export async function fetchDashboardOperationalData(
  params: PeriodSummaryParams,
): Promise<AnalyticsServiceResponse<DashboardOperationalData>> {
  const [sourceMix, prepTime, paymentHealth, topProducts, hourlyDemand] = await Promise.all([
    fetchOrderSourceMix(params),
    fetchPrepTimeStats(params),
    fetchPaymentHealth(params),
    fetchTopProducts(params),
    fetchHourlyDemand(params),
  ]);

  const firstError =
    sourceMix.error ?? prepTime.error ?? paymentHealth.error ?? topProducts.error ?? hourlyDemand.error;
  if (firstError) {
    return { data: null, error: firstError };
  }

  return {
    data: {
      orderSourceMix: sourceMix.data ?? [],
      prepTime: prepTime.data ?? { avgPrepMinutes: null, ordersWithPrep: 0, slaMetPct: null },
      paymentHealth: paymentHealth.data ?? {
        paidCount: 0,
        unpaidCount: 0,
        paidRevenue: 0,
        unpaidRevenue: 0,
        cardCount: 0,
        codCount: 0,
      },
      topProducts: topProducts.data ?? [],
      hourlyDemand: hourlyDemand.data ?? [],
    },
    error: null,
  };
}
