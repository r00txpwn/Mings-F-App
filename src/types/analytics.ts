export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'month_to_date'
  | 'last_month'
  | 'quarter_to_date'
  | 'year_to_date'
  | 'custom';

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface ExecutiveKpis {
  grossSales: number;
  netRevenue: number;
  cogs: number;
  opex: number;
  grossMarginPct: number;
  operatingProfit: number;
  bankFees: number;
  salesTax: number;
  payroll: number;
  employerContributions: number;
  netProfit: number;
  avgOrderValue: number;
  orderCount: number;
}

export interface FinanceCategoryContribution {
  categoryId: string;
  categoryName: string;
  amount: number;
  contributionPct: number;
}

export interface FinanceExpenseItemContribution {
  expenseItemId: string;
  expenseItemName: string;
  categoryId?: string;
  categoryName?: string;
  amount: number;
  contributionPct: number;
}

export interface ChannelPerformance {
  channelId: string;
  channelName: string;
  grossSales: number;
  netRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  /** Revenue share % of total channel revenue (not gross margin). */
  revenueSharePct?: number;
  /** @deprecated Use revenueSharePct — kept for backward compatibility */
  grossMarginPct?: number;
}

export interface TimeseriesPoint {
  periodStart: string;
  periodEnd?: string;
  granularity: TimeGranularity;
  value: number;
}

export type ReconciliationStatus = 'matched' | 'underpaid' | 'overpaid' | 'pending';

export interface PayoutReconciliationItem {
  payoutId: string;
  provider: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  status: ReconciliationStatus;
  settledAt?: string | null;
}

export interface PayoutReconciliationSummary {
  totalExpected: number;
  totalActual: number;
  totalDifference: number;
  matchedCount: number;
  mismatchedCount: number;
  pendingCount: number;
  items: PayoutReconciliationItem[];
}

export type MetricDirection = 'up' | 'down' | 'flat';

export interface MetricDelta<TValue extends number = number> {
  current: TValue;
  previous: TValue;
  absoluteChange: number;
  pctChange: number | null;
  direction: MetricDirection;
}

export type DashboardMetricFormat = 'currency' | 'number' | 'percent';

export type DashboardMetricKey = keyof ExecutiveKpis;

export interface DashboardMetricCard<TValue extends number = number> {
  key: DashboardMetricKey;
  label: string;
  value: TValue;
  format: DashboardMetricFormat;
  delta?: MetricDelta<TValue>;
}
export type AnalyticsSourceFilter =
  | 'all'
  | 'manual'
  | 'kiosk'
  | 'online_delivery'
  | 'online_takeaway'
  | 'pos_eat_in'
  | 'pos_takeaway'
  | 'pos_delivery';
export type ExpenseScope = 'operational' | 'purchases' | 'all';
export type TrendGranularity = 'day' | 'week' | 'month';

export interface DateRangeParams {
  startDate: string;
  endDate: string;
}

export interface RevenueCostTrendParams extends DateRangeParams {
  granularity?: TrendGranularity;
  source?: AnalyticsSourceFilter;
}

export interface ExpenseBreakdownParams extends DateRangeParams {
  scope?: ExpenseScope;
}

export interface PayoutReconciliationParams extends DateRangeParams {
  channelIds?: string[];
}

export interface ChannelPerformanceParams extends DateRangeParams {
  source?: AnalyticsSourceFilter;
  includeInactiveChannels?: boolean;
}

export interface RevenueCostTrendPoint {
  bucket: string;
  revenue: number;
  operationalExpense: number;
  purchaseCost: number;
  net: number;
  orders: number;
}

export interface ExpenseBreakdownItem {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  expenseItemId: string | null;
  expenseItemName: string;
  scope: Exclude<ExpenseScope, 'all'>;
  total: number;
  count: number;
}

export interface ExpenseBreakdownData {
  items: ExpenseBreakdownItem[];
  totals: {
    operational: number;
    purchases: number;
    overall: number;
  };
}

export interface FinancePayoutReconciliationItem {
  payoutId: string;
  channelId: string;
  channelName: string;
  periodStart: string;
  periodEnd: string;
  payoutDate: string;
  payoutAmount: number;
  grossSales: number;
  commissionAmount: number;
  commissionRate: number;
}

export interface ChannelPerformanceItem {
  channelId: string;
  channelName: string;
  channelIcon: string;
  channelColor: string;
  channelLogoUrl: string | null;
  revenue: number;
  orders: number;
  aov: number;
  share: number;
}

export interface AnalyticsServiceResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PeriodSummary {
  grossSales: number;
  discounts: number;
  refunds: number;
  tips: number;
  orderCount: number;
  cogs: number;
  opex: number;
  bankFees: number;
  salesTax: number;
  payroll: number;
  employerContributions: number;
  payrollTaxLiability: number;
  cashTurnover: number;
  nonCashTurnover: number;
}

export interface PeriodSummaryParams extends DateRangeParams {
  source?: AnalyticsSourceFilter;
}

export interface OrderSourceMixItem {
  source: string;
  orderCount: number;
  revenue: number;
  sharePct: number;
}

export interface TopProductItem {
  productName: string;
  quantity: number;
  revenue: number;
}

export interface PrepTimeStats {
  avgPrepMinutes: number | null;
  ordersWithPrep: number;
  slaMetPct: number | null;
}

export interface HourlyDemandPoint {
  hour: number;
  orderCount: number;
  revenue: number;
}

export interface PaymentHealthStats {
  paidCount: number;
  unpaidCount: number;
  paidRevenue: number;
  unpaidRevenue: number;
  cardCount: number;
  codCount: number;
}

export interface DashboardOperationalData {
  orderSourceMix: OrderSourceMixItem[];
  prepTime: PrepTimeStats;
  paymentHealth: PaymentHealthStats;
  topProducts: TopProductItem[];
  hourlyDemand: HourlyDemandPoint[];
}
