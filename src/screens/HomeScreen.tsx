import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LineChart } from '../components/LineChart';
import {
  ChartCard,
  FilterBar,
  InsightPanel,
  KpiCard,
  type DatePreset,
} from '../components/analytics';
import { HomeDetailsSection } from '../components/home/HomeDetailsSection';
import { OperationalStrip } from '../components/home/OperationalStrip';
import { SourceFilterChips } from '../components/home/SourceFilterChips';
import { SectionHeader } from '../components/ui/SectionHeader';
import {
  computeDelta,
  computeExecutiveKpis,
  fetchChannelPerformance,
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
  DashboardOperationalData,
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
  const [currentSummary, setCurrentSummary] = useState<Awaited<ReturnType<typeof fetchPeriodSummary>>['data']>(null);
  const [previousSummary, setPreviousSummary] = useState<Awaited<ReturnType<typeof fetchPeriodSummary>>['data']>(null);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [orderMetricView, setOrderMetricView] = useState<'aov' | 'orders'>('orders');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outstandingDebt, setOutstandingDebt] = useState<number | null>(null);
  const [accountBalances, setAccountBalances] = useState<AccountBalances | null>(null);

  const dateRange = useMemo(
    () => getDateRange(preset, customStartDate, customEndDate),
    [preset, customStartDate, customEndDate],
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
      operationalRes.error;

    if (firstError) {
      setError(firstError);
    }

    const channels = channelRes.data ?? [];
    setTrendData(trendRes.data ?? []);
    setExpenseBreakdown(expenseRes.data);
    setPayoutReconciliation(payoutRes.data);
    setChannelPerformance(channels);
    setCurrentSummary(summaryRes.data);
    setPreviousSummary(prevSummaryRes.data);
    setOperationalData(operationalRes.data);
    setOutstandingDebt(debtRes.data ?? null);
    setAccountBalances(cashRes.data ?? null);

    if (selectedChannels.size === 0 && channels.length > 0) {
      setSelectedChannels(new Set(channels.map((c) => c.channelId)));
    }

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
      platformCommissions: summary.platformCommissions ?? 0,
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
      platformCommissions: previousSummary.platformCommissions ?? 0,
      orderCount: previousSummary.orderCount,
    });
  }, [previousSummary]);

  const deltaFor = (current: number, previous: number | undefined) => {
    if (!comparePrevious || previous === undefined) return undefined;
    return formatDeltaBadge(computeDelta(current, previous));
  };

  const heroCards = useMemo((): Array<{
    label: string;
    value: string;
    subtitle: string;
    delta?: { text: string; trend: 'up' | 'down' | 'neutral' };
    trendOverride?: 'up' | 'down' | 'neutral';
  }> => {
    const prev = previousKpis;
    return [
      {
        label: t.netRevenueLabel,
        value: `₼${kpis.netRevenue.toFixed(2)}`,
        subtitle: t.kpiNetRevenueHint,
        delta: deltaFor(kpis.netRevenue, prev?.netRevenue),
      },
      {
        label: t.orders,
        value: kpis.orderCount.toFixed(0),
        subtitle: t.dashboardOrdersHint,
        delta: deltaFor(kpis.orderCount, prev?.orderCount),
      },
      {
        label: t.aov,
        value: `₼${kpis.avgOrderValue.toFixed(2)}`,
        subtitle: t.dashboardAovHint,
        delta: deltaFor(kpis.avgOrderValue, prev?.avgOrderValue),
      },
      {
        label: t.grossMarginLabel,
        value: `${kpis.grossMarginPct.toFixed(1)}%`,
        subtitle: `COGS ₼${kpis.cogs.toFixed(2)} • OPEX ₼${kpis.opex.toFixed(2)}`,
        delta: deltaFor(kpis.grossMarginPct, prev?.grossMarginPct),
        trendOverride: kpis.grossMarginPct >= 35 ? 'up' : kpis.grossMarginPct >= 20 ? 'neutral' : 'down',
      },
      {
        label: t.foodCost,
        value: `${kpis.foodCostPct.toFixed(1)}%`,
        subtitle: `COGS ₼${kpis.cogs.toFixed(2)}`,
        delta: deltaFor(kpis.foodCostPct, prev?.foodCostPct),
        // Lower food cost is better
        trendOverride: kpis.foodCostPct <= 30 ? 'up' : kpis.foodCostPct <= 40 ? 'neutral' : 'down',
      },
      {
        label: t.operatingProfitLabel,
        value: `₼${kpis.operatingProfit.toFixed(2)}`,
        subtitle: t.kpiOperatingProfitHint,
        delta: deltaFor(kpis.operatingProfit, prev?.operatingProfit),
        trendOverride: kpis.operatingProfit >= 0 ? 'up' : 'down',
      },
      {
        label: t.staffSalariesLabel,
        value: `₼${kpis.payroll.toFixed(2)}`,
        subtitle: t.staffSalariesHint,
        delta: deltaFor(kpis.payroll, prev?.payroll),
        trendOverride: 'neutral',
      },
      {
        label: t.netProfitLabel,
        value: `₼${kpis.netProfit.toFixed(2)}`,
        subtitle: (() => {
          const base = t.kpiNetProfitHintExtended
            .replace('{fees}', kpis.bankFees.toFixed(2))
            .replace('{commissions}', kpis.platformCommissions.toFixed(2))
            .replace('{payroll}', kpis.payroll.toFixed(2));
          const compare = deltaFor(kpis.netProfit, prev?.netProfit);
          return compare ? `${base} · ${compare.text}` : base;
        })(),
        // Top-right badge: net profit % (green profit / red loss)
        delta: { text: `${kpis.netProfitPct.toFixed(1)}%`, trend: kpis.netProfit >= 0 ? 'up' : 'down' },
        trendOverride: kpis.netProfit >= 0 ? 'up' : 'down',
      },
      ...(accountBalances != null
        ? [
            {
              label: t.accountCash,
              value: `₼${accountBalances.cash.toFixed(2)}`,
              subtitle: t.cashOnHandHint,
            },
            {
              label: t.accountBank,
              value: `₼${accountBalances.bank.toFixed(2)}`,
              subtitle: t.accountBankHint,
            },
            {
              label: t.accountCard,
              value: `₼${accountBalances.card.toFixed(2)}`,
              subtitle: t.accountCardHint,
            },
          ]
        : []),
      ...(outstandingDebt != null
        ? [
            {
              label: t.outstandingDebtLabel,
              value: `₼${outstandingDebt.toFixed(2)}`,
              subtitle: t.outstandingDebtHint,
            },
          ]
        : []),
    ];
  }, [comparePrevious, kpis, previousKpis, outstandingDebt, accountBalances, t]);

  const financeTrendSeries = useMemo(
    () => [
      {
        label: t.revenueLabel,
        color: '#fbbf24',
        data: trendData.map((d) => ({ date: d.bucket, value: d.revenue })),
      },
      {
        label: t.operationalExpenseLabel,
        color: '#f43f5e',
        data: trendData.map((d) => ({ date: d.bucket, value: d.operationalExpense })),
      },
      {
        label: t.purchaseCostLabel,
        color: '#f59e0b',
        data: trendData.map((d) => ({ date: d.bucket, value: d.purchaseCost })),
      },
      {
        label: t.netProfitLabel,
        color: '#92400e',
        data: trendData.map((d) => ({ date: d.bucket, value: d.net })),
      },
    ],
    [trendData, t.revenueLabel, t.operationalExpenseLabel, t.purchaseCostLabel, t.netProfitLabel],
  );

  const orderVolumeSeries = useMemo(() => {
    if (orderMetricView === 'aov') {
      return [
        {
          label: t.aov,
          color: '#fbbf24',
          data: trendData.map((d) => ({
            date: d.bucket,
            value: d.orders > 0 ? d.revenue / d.orders : 0,
          })),
        },
      ];
    }
    return [
      {
        label: t.orders,
        color: '#d97706',
        data: trendData.map((d) => ({ date: d.bucket, value: d.orders })),
      },
    ];
  }, [trendData, orderMetricView, t.aov, t.orders]);

  const peakHours = useMemo(() => {
    const hours = operationalData?.hourlyDemand ?? [];
    if (hours.length === 0) return [];
    return [...hours].sort((a, b) => b.orderCount - a.orderCount).slice(0, 6);
  }, [operationalData]);

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

  const toggleChannel = (channelId: string) => {
    const next = new Set(selectedChannels);
    if (next.has(channelId)) next.delete(channelId);
    else next.add(channelId);
    setSelectedChannels(next);
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

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <KpiCard key={i} label={t.revenueLabel} value="--" loading />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {heroCards.map((card) => (
              <KpiCard
                key={card.label}
                label={card.label}
                value={card.value}
                subtitle={card.subtitle}
                delta={card.delta?.text}
                trend={
                  'trendOverride' in card && card.trendOverride
                    ? card.trendOverride
                    : card.delta?.trend ?? 'neutral'
                }
              />
            ))}
          </div>

          {error ? (
            <div className="mt-3">
              <InsightPanel title={t.errorOccurred} severity="warning">
                <p>{error}</p>
              </InsightPanel>
            </div>
          ) : null}

          {validationIssues.length > 0 ? (
            <div className="mt-3">
              <InsightPanel title={t.errorOccurred} severity="warning">
                <p className="text-sm">{t.dataConsistencyWarning.replace('{count}', String(validationIssues.length))}</p>
              </InsightPanel>
            </div>
          ) : null}

          <div className="mt-4">
            <SectionHeader title={t.operationalInsights} />
            <OperationalStrip data={operationalData} payout={payoutReconciliation} />
          </div>

          <div className="mt-4 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
            <ChartCard compact title={t.revenueVsCostsTrend}>
              <LineChart series={financeTrendSeries} height={220} />
            </ChartCard>
            <ChartCard
              compact
              title={t.orderMetricsTrend}
              actions={
                <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                  {(['orders', 'aov'] as const).map((view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setOrderMetricView(view)}
                      className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                        orderMetricView === view
                          ? 'bg-cockpit-600 text-white dark:bg-cockpit-500'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      {view === 'aov' ? t.aov : t.orders}
                    </button>
                  ))}
                </div>
              }
            >
              <LineChart
                series={orderVolumeSeries}
                height={220}
                valueFormat={orderMetricView === 'aov' ? 'currency' : 'integer'}
              />
            </ChartCard>
          </div>

          <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
            <ChartCard compact title={t.topProducts}>
              {(operationalData?.topProducts ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">{t.noDataForPeriod}</p>
              ) : (
                <ul className="space-y-2">
                  {(operationalData?.topProducts ?? []).map((product, index) => (
                    <li
                      key={product.productName}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                          {index + 1}. {product.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.quantity.toFixed(0)} {t.orders}
                        </p>
                      </div>
                      <p className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        ₼{product.revenue.toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </ChartCard>

            <ChartCard compact title={t.salesByChannel}>
              <div className="mb-2 flex flex-wrap gap-2">
                {channelPerformance.map((channel) => {
                  const isSelected = selectedChannels.has(channel.channelId);
                  return (
                    <button
                      key={channel.channelId}
                      type="button"
                      onClick={() => toggleChannel(channel.channelId)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                        isSelected
                          ? 'border-cockpit-600 bg-cockpit-600 text-white dark:border-cockpit-500 dark:bg-cockpit-500'
                          : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      {channel.channelName}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {channelPerformance
                  .filter((channel) => selectedChannels.has(channel.channelId))
                  .map((channel) => (
                    <div
                      key={channel.channelId}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/50"
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{channel.channelName}</p>
                      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                        ₼{channel.grossSales.toFixed(2)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {channel.orderCount.toFixed(0)} {t.orders} • ₼{channel.avgOrderValue.toFixed(2)} {t.aov} •{' '}
                        {(channel.revenueSharePct ?? channel.grossMarginPct ?? 0).toFixed(1)}% {t.revenueShare}
                      </p>
                    </div>
                  ))}
              </div>
            </ChartCard>

            <ChartCard compact title={t.peakHours}>
              {peakHours.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">{t.noDataForPeriod}</p>
              ) : (
                <ul className="space-y-2">
                  {peakHours.map((slot) => (
                    <li
                      key={slot.hour}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {String(slot.hour).padStart(2, '0')}:00
                      </span>
                      <span className="font-mono text-sm tabular-nums text-slate-900 dark:text-white">
                        {slot.orderCount} {t.orders}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </ChartCard>
          </div>

          <HomeDetailsSection
            expenseBreakdown={expenseBreakdown}
            payoutReconciliation={payoutReconciliation}
          />
        </>
      )}
    </div>
  );
}
