import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { applyAnalyticsSourceFilter } from '../lib/analyticsSourceFilter';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import {
  ChartCard,
  FilterBar,
  InsightPanel,
  KpiCard,
  type DatePreset,
} from '../components/analytics';
import { SourceFilterChips } from '../components/home/SourceFilterChips';
import {
  fetchChannelPerformance,
  fetchExpenseBreakdown,
  fetchPayoutReconciliation,
  fetchPeriodSummary,
  fetchRevenueCostTrend,
  computeExecutiveKpis,
  type AnalyticsSourceFilter,
} from '../services/analytics';
import { PageHeader } from '../components/cockpit';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';

interface ActivityItem {
  id: string;
  date: string;
  type: 'sale' | 'expense' | 'purchase';
  description: string;
  amount: number;
}

const toISO = (date: Date): string => date.toISOString().split('T')[0];
const toCurrency = (value: number): string => `₼${value.toFixed(2)}`;
const safeNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

function getPresetRange(preset: DatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = toISO(now);

  if (preset === 'today') {
    return { startDate: endDate, endDate };
  }
  if (preset === '7d') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { startDate: toISO(start), endDate };
  }
  if (preset === '30d') {
    const start = new Date(now);
    start.setDate(now.getDate() - 29);
    return { startDate: toISO(start), endDate };
  }
  if (preset === 'qtd') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return { startDate: toISO(new Date(now.getFullYear(), quarterStartMonth, 1)), endDate };
  }

  return { startDate: toISO(new Date(now.getFullYear(), now.getMonth(), 1)), endDate };
}

export function ReportsScreen() {
  const { t } = useLanguage();
  const [{ startDate, endDate }, setDateRange] = useState(() => getPresetRange('mtd'));
  const [preset, setPreset] = useState<DatePreset>('mtd');
  const [sourceFilter, setSourceFilter] = useState<AnalyticsSourceFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totals, setTotals] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    totalCommissions: 0,
    payroll: 0,
    netProfit: 0,
    foodCostPct: 0,
    netProfitPct: 0,
  });
  const [channelStats, setChannelStats] = useState<Array<{ name: string; sales: number; orders: number; aov: number; share: number }>>([]);
  const [opexCategoryStats, setOpexCategoryStats] = useState<Array<{ name: string; total: number; count: number; percentage: number; color: string }>>([]);
  const [cogsCategoryStats, setCogsCategoryStats] = useState<Array<{ name: string; total: number; count: number; percentage: number; color: string }>>([]);
  const [commissionByChannel, setCommissionByChannel] = useState<Array<{ name: string; commission: number }>>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    const trendPromise = fetchRevenueCostTrend({
      startDate,
      endDate,
      source: sourceFilter,
      granularity: 'day',
    });
    const channelPromise = fetchChannelPerformance({
      startDate,
      endDate,
      source: sourceFilter,
      includeInactiveChannels: false,
    });
    const expensesPromise = fetchExpenseBreakdown({
      startDate,
      endDate,
      scope: 'all',
    });
    const payoutsPromise = fetchPayoutReconciliation({
      startDate,
      endDate,
    });
    const summaryPromise = fetchPeriodSummary({
      startDate,
      endDate,
      source: sourceFilter,
    });

    let salesQuery = supabase
      .from('sales')
      .select('id, sale_date, total_price, sales_channels(name)')
      .gte('sale_date', startDate)
      .lte('sale_date', `${endDate}T23:59:59`)
      .order('sale_date', { ascending: false })
      .limit(50);
    salesQuery = applyAnalyticsSourceFilter(salesQuery, sourceFilter);

    const activityPromise = Promise.all([
      salesQuery,
      supabase
        .from('operational_expenses')
        .select('id, expense_date, amount, description, expense_items(name), master_categories(name)')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false })
        .limit(50),
      supabase
        .from('purchases')
        .select('id, purchase_date, total_cost, products(name), master_categories(name)')
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate)
        .order('purchase_date', { ascending: false })
        .limit(50),
    ]);

    const [trendRes, channelRes, expensesRes, payoutsRes, summaryRes, activityRes] = await Promise.all([
      trendPromise,
      channelPromise,
      expensesPromise,
      payoutsPromise,
      summaryPromise,
      activityPromise,
    ]);

    const firstError =
      trendRes.error ||
      channelRes.error ||
      expensesRes.error ||
      payoutsRes.error ||
      summaryRes.error ||
      activityRes[0].error?.message ||
      activityRes[1].error?.message ||
      activityRes[2].error?.message ||
      null;

    if (firstError) {
      setError(firstError);
      setTotals({
        totalSales: 0,
        totalOrders: 0,
        totalPurchases: 0,
        totalExpenses: 0,
        totalCommissions: 0,
        payroll: 0,
        netProfit: 0,
        foodCostPct: 0,
        netProfitPct: 0,
      });
      setChannelStats([]);
      setOpexCategoryStats([]);
      setCogsCategoryStats([]);
      setCommissionByChannel([]);
      setActivityItems([]);
      setLoading(false);
      return;
    }

    const trendData = trendRes.data ?? [];
    const revenue = trendData.reduce((sum, point) => sum + point.revenue, 0);
    const orders = trendData.reduce((sum, point) => sum + point.orders, 0);

    const expenseData = expensesRes.data;
    const purchasesTotal = expenseData?.totals.purchases ?? 0;
    const operationalTotal = expenseData?.totals.operational ?? 0;

    const reconciliationItems = payoutsRes.data?.items ?? [];
    const commissionMap = new Map<string, number>();
    for (const item of reconciliationItems) {
      const commission = Math.max(0, item.expectedAmount - item.actualAmount);
      if (commission <= 0) continue;
      commissionMap.set(item.provider, (commissionMap.get(item.provider) ?? 0) + commission);
    }
    const commissions = [...commissionMap.entries()]
      .map(([name, commission]) => ({ name, commission }))
      .sort((a, b) => b.commission - a.commission);
    const totalCommissions = commissions.reduce((sum, item) => sum + item.commission, 0);
    const summary = summaryRes.data;
    const executiveKpis = summary
      ? computeExecutiveKpis({
          grossSales: summary.grossSales,
          discounts: summary.discounts,
          refunds: summary.refunds,
          cogs: summary.cogs,
          opex: summary.opex,
          bankFees: summary.bankFees ?? 0,
          payroll: summary.payroll ?? 0,
          platformCommissions: summary.platformCommissions ?? 0,
          orderCount: summary.orderCount,
        })
      : null;

    setTotals({
      totalSales: revenue,
      totalOrders: orders,
      totalPurchases: purchasesTotal,
      totalExpenses: operationalTotal,
      totalCommissions,
      payroll: summary?.payroll ?? 0,
      netProfit: executiveKpis
        ? executiveKpis.netProfit
        : revenue - purchasesTotal - operationalTotal - totalCommissions,
      foodCostPct: executiveKpis?.foodCostPct ?? (revenue > 0 ? (purchasesTotal / revenue) * 100 : 0),
      netProfitPct: executiveKpis?.netProfitPct ?? (revenue > 0
        ? ((revenue - purchasesTotal - operationalTotal - totalCommissions) / revenue) * 100
        : 0),
    });

    const channelData = channelRes.data ?? [];
    setChannelStats(
      channelData
        .filter((item) => item.grossSales > 0)
        .map((item) => ({
          name: item.channelName,
          sales: item.grossSales,
          orders: item.orderCount,
          aov: item.avgOrderValue,
          share: item.grossMarginPct ?? 0,
        }))
    );

    const allExpenseItems = expenseData?.items ?? [];
    const opexItems = allExpenseItems.filter((item) => item.scope === 'operational');
    const cogsItems = allExpenseItems.filter((item) => item.scope === 'purchases');
    setOpexCategoryStats(
      opexItems.map((item) => ({
        name: item.categoryName || t.noCategory,
        total: item.total,
        count: item.count,
        color: item.categoryColor || '#9CA3AF',
        percentage: operationalTotal > 0 ? (item.total / operationalTotal) * 100 : 0,
      }))
    );
    setCogsCategoryStats(
      cogsItems.map((item) => ({
        name: item.categoryName || t.noCategory,
        total: item.total,
        count: item.count,
        color: item.categoryColor || '#9CA3AF',
        percentage: purchasesTotal > 0 ? (item.total / purchasesTotal) * 100 : 0,
      }))
    );
    setCommissionByChannel(commissions);

    const [salesActivityRes, expenseActivityRes, purchaseActivityRes] = activityRes;
    const activity: ActivityItem[] = [];
    for (const row of salesActivityRes.data ?? []) {
      const channel = Array.isArray(row.sales_channels) ? row.sales_channels[0] : row.sales_channels;
      activity.push({
        id: row.id,
        date: row.sale_date,
        type: 'sale',
        description: channel?.name || t.sales,
        amount: safeNumber(row.total_price),
      });
    }
    for (const row of expenseActivityRes.data ?? []) {
      const expenseItem = Array.isArray(row.expense_items) ? row.expense_items[0] : row.expense_items;
      const category = Array.isArray(row.master_categories) ? row.master_categories[0] : row.master_categories;
      activity.push({
        id: row.id,
        date: row.expense_date,
        type: 'expense',
        description: expenseItem?.name || category?.name || row.description || t.operationalExpenses,
        amount: safeNumber(row.amount),
      });
    }
    for (const row of purchaseActivityRes.data ?? []) {
      const product = Array.isArray(row.products) ? row.products[0] : row.products;
      const category = Array.isArray(row.master_categories) ? row.master_categories[0] : row.master_categories;
      activity.push({
        id: row.id,
        date: row.purchase_date,
        type: 'purchase',
        description: product?.name || category?.name || t.purchases,
        amount: safeNumber(row.total_cost),
      });
    }
    activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setActivityItems(activity.slice(0, 50));
    setLoading(false);
  }, [endDate, sourceFilter, startDate, t.noCategory, t.operationalExpenses, t.purchases, t.sales]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const netProfit = totals.netProfit;
  const aov = totals.totalOrders > 0 ? totals.totalSales / totals.totalOrders : 0;
  const foodCostPercentage = totals.foodCostPct;
  const commissionPercentage = totals.totalSales > 0 ? (totals.totalCommissions / totals.totalSales) * 100 : 0;
  const isEmpty = useMemo(
    () =>
      !loading &&
      !error &&
      totals.totalSales === 0 &&
      totals.totalExpenses === 0 &&
      totals.totalPurchases === 0 &&
      activityItems.length === 0,
    [activityItems.length, error, loading, totals.totalExpenses, totals.totalPurchases, totals.totalSales]
  );

  return (
    <div className="animate-fadeIn space-y-6 sm:space-y-8">
      <PageHeader eyebrow={t.reports} title={t.reports} description={t.financialInsights} icon={BarChart3} />

      <div className="space-y-3">
        <FilterBar
          selectedPreset={preset}
          onPresetChange={(nextPreset) => {
            setPreset(nextPreset);
            if (nextPreset !== 'custom') {
              setDateRange(getPresetRange(nextPreset));
            }
          }}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={(value) => {
            setPreset('custom');
            setDateRange((prev) => ({ ...prev, startDate: value }));
          }}
          onEndDateChange={(value) => {
            setPreset('custom');
            setDateRange((prev) => ({ ...prev, endDate: value }));
          }}
        />
        <div className="cockpit-panel-solid p-3">
          <SourceFilterChips value={sourceFilter} onChange={setSourceFilter} />
        </div>
      </div>

      <div className="font-mono text-xs text-slate-500 dark:text-slate-500">
        {new Date(startDate).toLocaleDateString()} — {new Date(endDate).toLocaleDateString()}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {error ? (
        <InsightPanel title="Error" severity="critical">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadReports}
            className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
          >
            {t.confirm}
          </button>
        </InsightPanel>
      ) : null}

      {!loading && !error ? (
        <>
          {isEmpty ? (
            <EmptyState icon={BarChart3} title={t.noDataForPeriod} description={t.financialInsights} />
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
            <KpiCard label={t.totalSales} value={toCurrency(totals.totalSales)} />
            <KpiCard label={t.orders} value={totals.totalOrders} />
            <KpiCard
              label={t.cogs}
              value={toCurrency(totals.totalPurchases)}
              subtitle={`${t.foodCost}: ${foodCostPercentage.toFixed(1)}% ${t.ofSales}`}
            />
            <KpiCard label={t.operationalExpenses} value={toCurrency(totals.totalExpenses)} />
            <KpiCard label={t.platformCosts} value={toCurrency(totals.totalCommissions)} subtitle={`${commissionPercentage.toFixed(1)}% ${t.ofSales}`} />
            <KpiCard
              label={t.staffSalariesLabel}
              value={toCurrency(totals.payroll)}
              subtitle={t.staffSalariesHint}
            />
            <KpiCard
              label={t.netProfit}
              value={toCurrency(netProfit)}
              subtitle={`${t.aov}: ${toCurrency(aov)}`}
              delta={`${totals.netProfitPct.toFixed(1)}%`}
              trend={netProfit >= 0 ? 'up' : 'down'}
            />
          </div>

          {commissionByChannel.length > 0 ? (
            <InsightPanel title={t.platformCosts} severity="warning">
              <div className="space-y-1.5">
                {commissionByChannel.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span>{item.name}</span>
                    <span className="font-semibold">{toCurrency(item.commission)}</span>
                  </div>
                ))}
              </div>
            </InsightPanel>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title={t.salesByChannel}>
              {channelStats.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.noDataForPeriod}</p>
              ) : (
                <div className="space-y-3">
                  {channelStats.map((stat) => (
                    <div key={stat.name} className="rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{stat.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stat.share.toFixed(1)}% {t.ofSales}</p>
                      </div>
                      <div className="grid grid-cols-3 text-xs sm:text-sm">
                        <span>{toCurrency(stat.sales)}</span>
                        <span className="text-center">{stat.orders}</span>
                        <span className="text-right">{toCurrency(stat.aov)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>

            <ChartCard title={`${t.cogs} ${t.categoryBreakdown}`}>
              {cogsCategoryStats.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.noDataForPeriod}</p>
              ) : (
                <div className="space-y-3">
                  {cogsCategoryStats.slice(0, 10).map((stat) => (
                    <div key={`${stat.name}-${stat.total}`} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/40">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{stat.name}</span>
                        <span className="text-sm font-semibold" style={{ color: stat.color }}>{toCurrency(stat.total)}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stat.count} {t.transactions} - {stat.percentage.toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>
          </div>

          <ChartCard title={`${t.operationalExpenses} ${t.categoryBreakdown}`}>
            {opexCategoryStats.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.noDataForPeriod}</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {opexCategoryStats.slice(0, 12).map((stat) => (
                  <div key={`${stat.name}-${stat.total}`} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/40">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{stat.name}</span>
                      <span className="text-sm font-semibold" style={{ color: stat.color }}>{toCurrency(stat.total)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.count} {t.transactions} - {stat.percentage.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard title={t.transactionHistory}>
            {activityItems.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.noTransactionsInPeriod}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">{t.date}</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">{t.type}</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">{t.description}</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">{t.amount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityItems.map((item) => (
                      <tr key={`${item.type}-${item.id}`} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="px-2 py-2 text-sm text-gray-600 dark:text-gray-300">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="px-2 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {item.type === 'sale' ? t.sales : item.type === 'purchase' ? t.cogs : t.expense}
                        </td>
                        <td className="px-2 py-2 text-sm text-gray-600 dark:text-gray-300">{item.description}</td>
                        <td
                          className={`px-2 py-2 text-right text-sm font-semibold ${
                            item.type === 'sale'
                              ? 'text-green-600 dark:text-green-400'
                              : item.type === 'purchase'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-orange-600 dark:text-orange-400'
                          }`}
                        >
                          {item.type === 'sale' ? '+' : '-'}
                          {toCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ChartCard>

          <InsightPanel title={t.netProfit} severity={netProfit >= 0 ? 'success' : 'critical'}>
            <p>
              {t.netProfit} = {t.totalSales} - {t.cogs} - {t.operationalExpenses}
              {` - ${t.staffSalariesLabel}`}
              {totals.totalCommissions > 0 ? ` - ${t.platformCosts}` : ''}
            </p>
          </InsightPanel>
        </>
      ) : null}
    </div>
  );
}
