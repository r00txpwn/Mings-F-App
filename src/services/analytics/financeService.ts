import { supabase } from '../../lib/supabase';
import type {
  AnalyticsServiceResponse,
  ChannelPerformance,
  ChannelPerformanceParams,
  ExpenseBreakdownData,
  ExpenseBreakdownItem,
  ExpenseBreakdownParams,
  PayoutReconciliationParams,
  PayoutReconciliationSummary,
  ReconciliationStatus,
  RevenueCostTrendParams,
  RevenueCostTrendPoint,
  TrendGranularity,
} from '../../types/analytics';

type SaleRow = {
  sale_date: string;
  total_price: number | string | null;
  quantity: number | string | null;
  sales_channel_id: string | null;
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
    .select('sale_date, total_price, quantity')
    .gte('sale_date', params.startDate)
    .lte('sale_date', `${params.endDate}T23:59:59`);

  if (params.source && params.source !== 'all') {
    salesQuery = salesQuery.eq('source', params.source);
  }

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
    const point = getOrCreate(formatBucket(row.sale_date, granularity));
    point.revenue += safeNumber(row.total_price);
    point.orders += safeNumber(row.quantity);
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
  let channelsQuery = supabase.from('sales_channels').select('id, name, icon, color, logo_url, is_active');
  if (!params.includeInactiveChannels) {
    channelsQuery = channelsQuery.eq('is_active', true);
  }

  let salesQuery = supabase
    .from('sales')
    .select('sales_channel_id, total_price, quantity, sale_date')
    .gte('sale_date', params.startDate)
    .lte('sale_date', `${params.endDate}T23:59:59`);

  if (params.source && params.source !== 'all') {
    salesQuery = salesQuery.eq('source', params.source);
  }

  const [channelsRes, salesRes] = await Promise.all([channelsQuery, salesQuery]);
  const firstError = channelsRes.error ?? salesRes.error;
  if (firstError) {
    return { data: null, error: firstError.message };
  }

  const channels = (channelsRes.data ?? []) as SalesChannelRow[];
  const sales = (salesRes.data ?? []) as SaleRow[];
  const channelById = new Map(channels.map((c) => [c.id, c]));

  const performance = new Map<string, ChannelPerformance>();
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
    item.orderCount += safeNumber(sale.quantity);
  }

  // Keep visible channels in output even with zero sales.
  for (const channel of channels) {
    ensure(channel.id);
  }

  const totalRevenue = [...performance.values()].reduce((sum, item) => sum + item.grossSales, 0);
  const data = [...performance.values()]
    .map((item) => ({
      ...item,
      netRevenue: item.grossSales,
      avgOrderValue: item.orderCount > 0 ? item.grossSales / item.orderCount : 0,
      grossMarginPct: totalRevenue > 0 ? (item.grossSales / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.grossSales - a.grossSales);

  return { data, error: null };
}
