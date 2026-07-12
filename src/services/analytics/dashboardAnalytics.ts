import { applyAnalyticsSourceFilter } from '../../lib/analyticsSourceFilter';
import { fetchAllRows } from '../../lib/supabasePaginate';
import { supabase } from '../../lib/supabase';
import { fetchExpenseBreakdown, fetchPayoutReconciliation } from './financeService';
import type {
  AnalyticsServiceResponse,
  DashboardGroupAData,
  ExpenseBreakdownItem,
  PayrollTrendPoint,
  PeriodSummaryParams,
  PayoutReconciliationItem,
  RankedAmountItem,
} from '../../types/analytics';

type PurchaseRow = {
  total_cost: number | string | null;
  purchase_date: string;
  is_on_credit?: boolean | null;
  payment_method?: string | null;
  master_category_id?: string | null;
  master_categories?: { name: string | null; color: string | null } | { name: string | null; color: string | null }[] | null;
  suppliers?: { name: string | null } | { name: string | null }[] | null;
};

type SaleRow = {
  id?: string;
  sale_date?: string;
  total_price?: number | string | null;
  quantity?: number | string | null;
  source?: string | null;
  discount_amount?: number | string | null;
  tip_amount?: number | string | null;
  sales_channel_id?: string | null;
};

type SalaryRow = {
  amount: number | string | null;
  payment_date: string;
  payment_type?: string | null;
};

const safeNumber = (value: number | string | null | undefined): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const pickSingle = <T>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

const toIsoDate = (value: string): string => value.split('T')[0];

/** JS getDay(): 0=Sun … 6=Sat → dashboard weekday 0=Mon … 6=Sun */
function toDashboardWeekday(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}

export async function fetchDashboardGroupA(
  params: PeriodSummaryParams,
): Promise<AnalyticsServiceResponse<DashboardGroupAData>> {
  const { startDate, endDate } = params;

  const [purchasesRes, salesRes, payrollRes, expenseRes, payoutRes, channelsRes] = await Promise.all([
    supabase
      .from('purchases')
      .select('total_cost, purchase_date, is_on_credit, payment_method, master_category_id, master_categories(name, color), suppliers(name)')
      .gte('purchase_date', startDate)
      .lte('purchase_date', `${endDate}T23:59:59`),
    fetchAllRows<SaleRow>(() => {
      let q = supabase
        .from('sales')
        .select('id, sale_date, total_price, quantity, source, discount_amount, tip_amount, sales_channel_id')
        .gte('sale_date', startDate)
        .lte('sale_date', `${endDate}T23:59:59`);
      q = applyAnalyticsSourceFilter(q, params.source);
      return q as never;
    }),
    supabase
      .from('salary_payments')
      .select('amount, payment_date, payment_type')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate),
    fetchExpenseBreakdown({ startDate, endDate, scope: 'all' }),
    fetchPayoutReconciliation({ startDate, endDate }),
    supabase.from('sales_channels').select('id, name, color').eq('is_deleted', false),
  ]);

  const firstError =
    purchasesRes.error ??
    salesRes.error ??
    payrollRes.error ??
    expenseRes.error ??
    payoutRes.error ??
    channelsRes.error;

  if (firstError) {
    const message = typeof firstError === 'string' ? firstError : firstError.message ?? String(firstError);
    return { data: null, error: message };
  }

  const purchases = (purchasesRes.data ?? []) as PurchaseRow[];
  const sales = salesRes.data;
  const payroll = (payrollRes.data ?? []) as SalaryRow[];

  const supplierMap = new Map<string, number>();
  const cogsCatMap = new Map<string, { value: number; color: string }>();
  const paymentSplit = {
    creditAmount: 0,
    cashAmount: 0,
    cardAmount: 0,
    bankAmount: 0,
    otherAmount: 0,
  };

  for (const row of purchases) {
    const amount = safeNumber(row.total_cost);
    const supplierName = pickSingle(row.suppliers)?.name ?? 'Unknown';
    supplierMap.set(supplierName, (supplierMap.get(supplierName) ?? 0) + amount);

    const cat = pickSingle(row.master_categories);
    const catName = cat?.name ?? 'Uncategorized';
    const catEntry = cogsCatMap.get(catName) ?? { value: 0, color: cat?.color ?? '#f59e0b' };
    catEntry.value += amount;
    cogsCatMap.set(catName, catEntry);

    if (row.is_on_credit) {
      paymentSplit.creditAmount += amount;
    } else {
      const method = String(row.payment_method ?? '').toLowerCase();
      if (method.includes('cash')) paymentSplit.cashAmount += amount;
      else if (method.includes('card')) paymentSplit.cardAmount += amount;
      else if (method.includes('bank')) paymentSplit.bankAmount += amount;
      else paymentSplit.otherAmount += amount;
    }
  }

  const spendBySupplier: RankedAmountItem[] = [...supplierMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const cogsByCategory: RankedAmountItem[] = [...cogsCatMap.entries()]
    .map(([label, { value, color }]) => ({ label, value, color }))
    .sort((a, b) => b.value - a.value);

  const opexByCategory: RankedAmountItem[] = [];
  const opexCatMap = new Map<string, { value: number; color: string }>();
  for (const item of expenseRes.data?.items ?? []) {
    const expenseItem = item as ExpenseBreakdownItem;
    if (expenseItem.scope !== 'operational') continue;
    const entry = opexCatMap.get(expenseItem.categoryName) ?? { value: 0, color: expenseItem.categoryColor };
    entry.value += expenseItem.total;
    opexCatMap.set(expenseItem.categoryName, entry);
  }
  for (const [label, { value, color }] of opexCatMap.entries()) {
    opexByCategory.push({ label, value, color });
  }
  opexByCategory.sort((a, b) => b.value - a.value);

  const commissionByChannel: RankedAmountItem[] = (payoutRes.data?.items ?? [])
    .map((item: PayoutReconciliationItem) => ({
      label: item.provider,
      value: Math.max(0, item.expectedAmount - item.actualAmount),
    }))
    .filter((item: RankedAmountItem) => item.value > 0)
    .sort((a: RankedAmountItem, b: RankedAmountItem) => b.value - a.value);

  const payrollByMonth = new Map<string, PayrollTrendPoint>();
  for (const row of payroll) {
    const bucket = toIsoDate(row.payment_date).slice(0, 7);
    const entry = payrollByMonth.get(bucket) ?? { bucket, salary: 0, advance: 0, bonus: 0, partial: 0 };
    const amount = safeNumber(row.amount);
    const type = String(row.payment_type ?? 'salary');
    if (type === 'advance') entry.advance += amount;
    else if (type === 'bonus') entry.bonus += amount;
    else if (type === 'partial') entry.partial += amount;
    else entry.salary += amount;
    payrollByMonth.set(bucket, entry);
  }
  const payrollTrend = [...payrollByMonth.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));

  const weekdayDemand = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    orderCount: 0,
    revenue: 0,
  }));
  const heatmapMap = new Map<string, number>();
  const discountTipByDay = new Map<string, { discounts: number; tips: number }>();
  const aovCounts = new Map<string, number>();

  for (const row of sales) {
    const date = new Date(row.sale_date ?? '');
    if (Number.isNaN(date.getTime())) continue;
    const weekday = toDashboardWeekday(date);
    const hour = date.getHours();
    const revenue = safeNumber(row.total_price);
    weekdayDemand[weekday].revenue += revenue;
    const orderUnits =
      !row.source || row.source === 'manual'
        ? Math.max(1, safeNumber(row.quantity))
        : 1;
    weekdayDemand[weekday].orderCount += orderUnits;

    const heatKey = `${weekday}:${hour}`;
    heatmapMap.set(heatKey, (heatmapMap.get(heatKey) ?? 0) + orderUnits);

    const dayKey = toIsoDate(date.toISOString());
    const dt = discountTipByDay.get(dayKey) ?? { discounts: 0, tips: 0 };
    dt.discounts += safeNumber(row.discount_amount);
    dt.tips += safeNumber(row.tip_amount);
    discountTipByDay.set(dayKey, dt);

    const price = revenue;
    let bucket = '40+';
    if (price < 15) bucket = '<15';
    else if (price < 25) bucket = '15-25';
    else if (price < 40) bucket = '25-40';
    aovCounts.set(bucket, (aovCounts.get(bucket) ?? 0) + 1);
  }

  const demandHeatmap = [...heatmapMap.entries()].map(([key, orderCount]) => {
    const [weekday, hour] = key.split(':').map(Number);
    return { weekday, hour, orderCount };
  });

  const discountTipTrend = [...discountTipByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, values]) => ({ bucket, ...values }));

  const aovBuckets = [
    { label: '<15', count: aovCounts.get('<15') ?? 0 },
    { label: '15-25', count: aovCounts.get('15-25') ?? 0 },
    { label: '25-40', count: aovCounts.get('25-40') ?? 0 },
    { label: '40+', count: aovCounts.get('40+') ?? 0 },
  ];

  const channelById = new Map(
    ((channelsRes.data ?? []) as { id: string; name: string; color: string | null }[]).map((c) => [c.id, c]),
  );
  const channelRevenue = new Map<string, number>();
  for (const row of sales) {
    const id = row.sales_channel_id ?? 'unknown';
    channelRevenue.set(id, (channelRevenue.get(id) ?? 0) + safeNumber(row.total_price));
  }
  const channelMix: RankedAmountItem[] = [...channelRevenue.entries()]
    .map(([id, value]) => {
      const ch = channelById.get(id);
      return { label: ch?.name ?? 'Unknown', value, color: ch?.color ?? undefined };
    })
    .sort((a, b) => b.value - a.value);

  return {
    data: {
      spendBySupplier,
      cogsByCategory,
      opexByCategory,
      purchasePaymentSplit: paymentSplit,
      commissionByChannel,
      payrollTrend,
      weekdayDemand,
      demandHeatmap,
      aovBuckets,
      channelMix,
      discountTipTrend,
    },
    error: null,
  };
}
