import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  FilterBar,
  InsightPanel,
  type DatePreset,
} from '../components/analytics';
import { CustomersTab } from '../components/home/CustomersTab';
import { DashboardTabNav } from '../components/home/DashboardTabNav';
import { FinanceTab } from '../components/home/FinanceTab';
import { KitchenOpsTab } from '../components/home/KitchenOpsTab';
import { OverviewTab } from '../components/home/OverviewTab';
import { SourceFilterChips } from '../components/home/SourceFilterChips';
import {
  computeDelta,
  computeExecutiveKpis,
  fetchChannelPerformance,
  fetchDashboardGroupA,
  fetchDashboardOperationalData,
  fetchExpenseBreakdown,
  fetchPayoutReconciliation,
  fetchPeriodSummary,
  fetchRevenueCostTrend,
  getPreviousPeriodRange,
  validateAnalyticsSnapshot,
} from '../services/analytics';
import { fetchTotalOutstandingDebt } from '../services/finance/supplierFinanceService';
import { fetchAccountBalances } from '../services/finance/accountsService';
import type { AccountBalances } from '../services/finance/accounts';
import type {
  AnalyticsSourceFilter,
  ChannelPerformance,
  DashboardGroupAData,
  DashboardOperationalData,
  DashboardTabId,
  ExpenseBreakdownData,
  MetricDelta,
  PayoutReconciliationSummary,
  RevenueCostTrendPoint,
} from '../types/analytics';

function getDateRange(
  preset: DatePreset,
  customStartDate: string,
  customEndDate: string,
): { startDate: string; endDate: string } {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  if (preset === 'today') return { startDate: todayStr, endDate: todayStr };
  if (preset === '7d') {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    return { startDate: weekAgo.toISOString().split('T')[0], endDate: todayStr };
  }
  if (preset === '30d') {
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 29);
    return { startDate: monthAgo.toISOString().split('T')[0], endDate: todayStr };
  }
  if (preset === 'mtd') {
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: firstDayOfMonth.toISOString().split('T')[0], endDate: todayStr };
  }
  if (preset === 'qtd') {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
    const firstDayOfQuarter = new Date(today.getFullYear(), quarterStartMonth, 1);
    return { startDate: firstDayOfQuarter.toISOString().split('T')[0], endDate: todayStr };
  }
  return {
    startDate: customStartDate || todayStr,
    endDate: customEndDate || todayStr,
  };
}

function formatDeltaBadge(delta: MetricDelta<number>): { text: string; trend: 'up' | 'down' | 'neutral' } {
  if (delta.pctChange === null) {
    return { text: '—', trend: 'neutral' };
  }
  const sign = delta.pctChange >= 0 ? '+' : '';
  return {
    text: `${sign}${delta.pctChange.toFixed(1)}%`,
    trend: delta.direction === 'flat' ? 'neutral' : delta.direction === 'up' ? 'up' : 'down',
  };
}

export function HomeScreen() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<DashboardTabId>('overview');
  const [preset, setPreset] = useState<DatePreset>('mtd');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sourceFilter, setSourceFilter] = useState<AnalyticsSourceFilter>('all');
  const [comparePrevious, setComparePrevious] = useState(true);
  const [trendData, setTrendData] = useState<RevenueCostTrendPoint[]>([]);
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdownData | null>(null);
  const [payoutReconciliation, setPayoutReconciliation] = useState<PayoutReconciliationSummary | null>(null);
  const [operationalData, setOperationalData] = useState<DashboardOperationalData | null>(null);
  const [groupA, setGroupA] = useState<DashboardGroupAData | null>(null);
  const [currentSummary, setCurrentSummary] = useState<Awaited<ReturnType<typeof fetchPeriodSummary>>['data']>(null);
  const [previousSummary, setPreviousSummary] = useState<Awaited<ReturnType<typeof fetchPeriodSummary>>['data']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outstandingDebt, setOutstandingDebt] = useState<number | null>(null);
  const [accountBalances, setAccountBalances] = useState<AccountBalances | null>(null);

  const dateRange = useMemo(
    () => getDateRange(preset, customStartDate, customEndDate),
    [preset, customStartDate, customEndDate],
  );

  const weekdayLabels = useMemo(
    () => [
      t.dashboardWeekdayMon,
      t.dashboardWeekdayTue,
      t.dashboardWeekdayWed,
      t.dashboardWeekdayThu,
      t.dashboardWeekdayFri,
      t.dashboardWeekdaySat,
      t.dashboardWeekdaySun,
    ],
    [t],
  );

  useEffect(() => {
    void loadDashboard();
  }, [dateRange.startDate, dateRange.endDate, sourceFilter]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } = dateRange;
    const previousRange = getPreviousPeriodRange(startDate, endDate);
    const params = { startDate, endDate, source: sourceFilter };

    const [
      trendRes,
      expenseRes,
      payoutRes,
      channelRes,
      summaryRes,
      prevSummaryRes,
      operationalRes,
      groupARes,
      debtRes,
      cashRes,
    ] = await Promise.all([
      fetchRevenueCostTrend({ ...params, granularity: 'day' }),
      fetchExpenseBreakdown({ startDate, endDate, scope: 'all' }),
      fetchPayoutReconciliation({ startDate, endDate }),
      fetchChannelPerformance({ ...params, includeInactiveChannels: false }),
      fetchPeriodSummary(params),
      fetchPeriodSummary({ ...previousRange, source: sourceFilter }),
      fetchDashboardOperationalData(params),
      fetchDashboardGroupA(params),
      fetchTotalOutstandingDebt(),
      fetchAccountBalances(),
    ]);

    const firstError =
      trendRes.error ||
      expenseRes.error ||
      payoutRes.error ||
      channelRes.error ||
      summaryRes.error ||
      prevSummaryRes.error ||
      operationalRes.error ||
      groupARes.error;

    if (firstError) {
      setError(firstError);
    }

    setTrendData(trendRes.data ?? []);
    setExpenseBreakdown(expenseRes.data);
    setPayoutReconciliation(payoutRes.data);
    setChannelPerformance(channelRes.data ?? []);
    setCurrentSummary(summaryRes.data);
    setPreviousSummary(prevSummaryRes.data);
    setOperationalData(operationalRes.data);
    setGroupA(groupARes.data);
    setOutstandingDebt(debtRes.data ?? null);
    setAccountBalances(cashRes.data ?? null);
    setLoading(false);
  };

  const kpis = useMemo(() => {
    const summary = currentSummary;
    if (!summary) {
      const grossSales = trendData.reduce((sum, point) => sum + point.revenue, 0);
      const cogs = trendData.reduce((sum, point) => sum + point.purchaseCost, 0);
      const opex = trendData.reduce((sum, point) => sum + point.operationalExpense, 0);
      const orderCount = trendData.reduce((sum, point) => sum + point.orders, 0);
      return computeExecutiveKpis({ grossSales, cogs, opex, orderCount });
    }
    return computeExecutiveKpis({
      grossSales: summary.grossSales,
      discounts: summary.discounts,
      refunds: summary.refunds,
      cogs: summary.cogs,
      opex: summary.opex,
      bankFees: summary.bankFees ?? 0,
      payroll: summary.payroll ?? 0,
      orderCount: summary.orderCount,
    });
  }, [currentSummary, trendData]);

  const previousKpis = useMemo(() => {
    if (!previousSummary) return null;
    return computeExecutiveKpis({
      grossSales: previousSummary.grossSales,
      discounts: previousSummary.discounts,
      refunds: previousSummary.refunds,
      cogs: previousSummary.cogs,
      opex: previousSummary.opex,
      bankFees: previousSummary.bankFees ?? 0,
      payroll: previousSummary.payroll ?? 0,
      orderCount: previousSummary.orderCount,
    });
  }, [previousSummary]);

  const deltaFor = (current: number, previous: number | undefined) => {
    if (!comparePrevious || previous === undefined) return undefined;
    return formatDeltaBadge(computeDelta(current, previous));
  };

  const validationIssues = useMemo(() => {
    const channelRevenueTotal = channelPerformance.reduce((sum, channel) => sum + channel.grossSales, 0);
    return validateAnalyticsSnapshot({
      revenueTotal: kpis.grossSales,
      channelRevenueTotal,
      netRevenue: kpis.netRevenue,
      cogs: kpis.cogs,
      opex: kpis.opex,
      operatingProfit: kpis.operatingProfit,
      payoutReconciliation,
    });
  }, [channelPerformance, kpis, payoutReconciliation]);

  const viewProps = {
    loading,
    kpis,
    previousKpis,
    comparePrevious,
    trendData,
    channelPerformance,
    expenseBreakdown,
    payoutReconciliation,
    operationalData,
    groupA,
    accountBalances,
    outstandingDebt,
    weekdayLabels,
    deltaFor,
  };

  return (
    <div className="animate-fadeIn">
      <h1 className="sr-only">{t.home}</h1>
      <div className="mb-4 space-y-3">
        <FilterBar
          selectedPreset={preset}
          onPresetChange={setPreset}
          startDate={customStartDate}
          endDate={customEndDate}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
          channelFilter={
            <button
              type="button"
              onClick={() => setComparePrevious((prev) => !prev)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                comparePrevious
                  ? 'border-cockpit-300 bg-cockpit-50 text-cockpit-800 dark:border-cockpit-700 dark:bg-cockpit-950 dark:text-cockpit-200'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {t.comparePreviousPeriod}
            </button>
          }
        />
        <SourceFilterChips value={sourceFilter} onChange={setSourceFilter} />
      </div>

      <DashboardTabNav activeTab={activeTab} onChange={setActiveTab} />

      {error ? (
        <div className="mb-3">
          <InsightPanel title={t.errorOccurred} severity="warning">
            <p>{error}</p>
          </InsightPanel>
        </div>
      ) : null}

      {validationIssues.length > 0 ? (
        <div className="mb-3">
          <InsightPanel title={t.errorOccurred} severity="warning">
            <p className="text-sm">{t.dataConsistencyWarning.replace('{count}', String(validationIssues.length))}</p>
          </InsightPanel>
        </div>
      ) : null}

      {activeTab === 'overview' ? <OverviewTab {...viewProps} /> : null}
      {activeTab === 'kitchen' ? <KitchenOpsTab {...viewProps} /> : null}
      {activeTab === 'finance' ? <FinanceTab {...viewProps} /> : null}
      {activeTab === 'customers' ? <CustomersTab /> : null}
    </div>
  );
}
