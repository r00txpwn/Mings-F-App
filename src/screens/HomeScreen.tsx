import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { PieChart } from '../components/PieChart';
import { LineChart } from '../components/LineChart';
import { ChartCard, FilterBar, InsightPanel, KpiCard, type DatePreset } from '../components/analytics';
import { WeatherForecastStrip } from '../components/home/WeatherForecastStrip';
import {
  computeExecutiveKpis,
  fetchChannelPerformance,
  fetchExpenseBreakdown,
  fetchPayoutReconciliation,
  fetchRevenueCostTrend,
  validateAnalyticsSnapshot,
} from '../services/analytics';
import type { ChannelPerformance, ExpenseBreakdownData, PayoutReconciliationSummary, RevenueCostTrendPoint } from '../types/analytics';

export function HomeScreen() {
  const { t } = useLanguage();
  const [preset, setPreset] = useState<DatePreset>('mtd');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [trendData, setTrendData] = useState<RevenueCostTrendPoint[]>([]);
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdownData | null>(null);
  const [payoutReconciliation, setPayoutReconciliation] = useState<PayoutReconciliationSummary | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [orderMetricView, setOrderMetricView] = useState<'aov' | 'orders'>('aov');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chartHeight = 200;
  const pieSize = 190;

  useEffect(() => {
    void loadDashboard();
  }, [preset, customStartDate, customEndDate]);

  const getDateRange = (): { startDate: string; endDate: string } => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (preset === 'today') {
      return { startDate: todayStr, endDate: todayStr };
    }
    if (preset === '7d') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { startDate: weekAgo.toISOString().split('T')[0], endDate: todayStr };
    }
    if (preset === '30d') {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
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
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } = getDateRange();
    const [trendRes, expenseRes, payoutRes, channelRes] = await Promise.all([
      fetchRevenueCostTrend({ startDate, endDate, granularity: 'day', source: 'all' }),
      fetchExpenseBreakdown({ startDate, endDate, scope: 'all' }),
      fetchPayoutReconciliation({ startDate, endDate }),
      fetchChannelPerformance({ startDate, endDate, source: 'all', includeInactiveChannels: false }),
    ]);
    const firstError = trendRes.error || expenseRes.error || payoutRes.error || channelRes.error;
    if (firstError) {
      setError(firstError);
    }
    const trend = trendRes.data ?? [];
    const channels = channelRes.data ?? [];
    setTrendData(trend);
    setExpenseBreakdown(expenseRes.data);
    setPayoutReconciliation(payoutRes.data);
    setChannelPerformance(channels);
    if (selectedChannels.size === 0 && channels.length > 0) {
      setSelectedChannels(new Set(channels.map((c) => c.channelId)));
    }
    setLoading(false);
  };

  const kpis = useMemo(() => {
    const grossSales = trendData.reduce((sum, point) => sum + point.revenue, 0);
    const cogs = trendData.reduce((sum, point) => sum + point.purchaseCost, 0);
    const opex = trendData.reduce((sum, point) => sum + point.operationalExpense, 0);
    const orderCount = trendData.reduce((sum, point) => sum + point.orders, 0);
    return computeExecutiveKpis({
      grossSales,
      cogs,
      opex,
      orderCount,
    });
  }, [trendData]);

  const getPeriodLabel = () => {
    if (preset === 'today') return t.today;
    if (preset === '7d') return t.last7Days;
    if (preset === '30d') return t.last30Days;
    if (preset === 'mtd') return t.monthToDate;
    if (preset === 'qtd') return t.quarterToDate;
    if (preset === 'custom' && customStartDate && customEndDate) {
      return `${customStartDate} - ${customEndDate}`;
    }
    return t.custom;
  };

  const toggleChannel = (channelId: string) => {
    const newSelected = new Set(selectedChannels);
    if (newSelected.has(channelId)) {
      newSelected.delete(channelId);
    } else {
      newSelected.add(channelId);
    }
    setSelectedChannels(newSelected);
  };

  const financeTrendSeries = useMemo(
    () => [
      {
        label: t.revenueLabel,
        color: '#10B981',
        data: trendData.map((d) => ({ date: d.bucket, value: d.revenue })),
      },
      {
        label: t.operationalExpenseLabel,
        color: '#EF4444',
        data: trendData.map((d) => ({ date: d.bucket, value: d.operationalExpense })),
      },
      {
        label: t.purchaseCostLabel,
        color: '#F59E0B',
        data: trendData.map((d) => ({ date: d.bucket, value: d.purchaseCost })),
      },
    ],
    [trendData, t.revenueLabel, t.operationalExpenseLabel, t.purchaseCostLabel],
  );

  const orderVolumeSeries = useMemo(() => {
    if (orderMetricView === 'aov') {
      return [
        {
          label: t.aov,
          color: '#8B5CF6',
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
        color: '#3B82F6',
        data: trendData.map((d) => ({ date: d.bucket, value: d.orders })),
      },
    ];
  }, [trendData, orderMetricView, t.aov, t.orders]);

  const topExpenseCategories = useMemo(() => {
    const map = new Map<string, { amount: number; color: string }>();
    for (const item of expenseBreakdown?.items ?? []) {
      const key = item.categoryName;
      const entry = map.get(key) ?? { amount: 0, color: item.categoryColor };
      entry.amount += item.total;
      map.set(key, entry);
    }
    return [...map.entries()]
      .map(([label, value]) => ({ label, value: value.amount, color: value.color }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [expenseBreakdown]);

  const operatingProfitMarginPct = useMemo(() => {
    if (Math.abs(kpis.netRevenue) < 0.01) return null;
    return (kpis.operatingProfit / kpis.netRevenue) * 100;
  }, [kpis.netRevenue, kpis.operatingProfit]);

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

  return (
    <div className="animate-fadeIn">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cockpit-600 dark:text-cockpit-400">
            {t.liveMetrics}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t.home}</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">{t.overview}</p>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <div className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-500">{getPeriodLabel()}</div>
          <WeatherForecastStrip />
        </div>
      </div>

      <div className="mb-4">
        <FilterBar
          selectedPreset={preset}
          onPresetChange={setPreset}
          startDate={customStartDate}
          endDate={customEndDate}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label={t.revenueLabel} value="--" loading />
          <KpiCard label={t.netRevenueLabel} value="--" loading />
          <KpiCard label={t.operatingProfitLabel} value="--" loading />
          <KpiCard label={t.grossMarginLabel} value="--" loading />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label={t.grossSales}
              value={`₼${kpis.grossSales.toFixed(2)}`}
              subtitle={`${kpis.orderCount.toFixed(0)} ${t.orders} • ₼${kpis.avgOrderValue.toFixed(2)} ${t.aov}`}
            />
            <KpiCard
              label={t.netRevenueLabel}
              value={`₼${kpis.netRevenue.toFixed(2)}`}
              subtitle={t.kpiNetRevenueHint}
            />
            <KpiCard
              label={t.operatingProfitLabel}
              value={`₼${kpis.operatingProfit.toFixed(2)}`}
              subtitle={t.kpiOperatingProfitHint}
              trend={kpis.operatingProfit >= 0 ? 'up' : 'down'}
              delta={
                operatingProfitMarginPct === null
                  ? t.kpiRatioUnavailable
                  : `${operatingProfitMarginPct >= 0 ? '+' : ''}${operatingProfitMarginPct.toFixed(1)}%`
              }
            />
            <KpiCard
              label={t.grossMarginLabel}
              value={`${kpis.grossMarginPct.toFixed(1)}%`}
              subtitle={`COGS ₼${kpis.cogs.toFixed(2)} • OPEX ₼${kpis.opex.toFixed(2)}`}
              trend={kpis.grossMarginPct >= 35 ? 'up' : kpis.grossMarginPct >= 20 ? 'neutral' : 'down'}
            />
          </div>

          {error && (
            <div className="mt-3">
              <InsightPanel title={t.errorOccurred} severity="warning">
                <p>{error}</p>
              </InsightPanel>
            </div>
          )}

          {validationIssues.length > 0 && (
            <div className="mt-3">
              <InsightPanel title={t.errorOccurred} severity="warning">
                <p className="text-sm">Detected {validationIssues.length} consistency issue(s) in aggregated KPI data.</p>
                <ul className="mt-2 list-disc pl-5">
                  {validationIssues.slice(0, 3).map((item) => (
                    <li key={item.code}>
                      {item.message} (delta: ₼{item.delta.toFixed(2)})
                    </li>
                  ))}
                </ul>
              </InsightPanel>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
            <ChartCard compact title={t.revenueVsCostsTrend}>
              <LineChart series={financeTrendSeries} height={chartHeight} />
            </ChartCard>
            <ChartCard
              compact
              title={t.orderMetricsTrend}
              actions={
                <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setOrderMetricView('aov')}
                    className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                      orderMetricView === 'aov'
                        ? 'bg-cockpit-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                    }`}
                  >
                    {t.aov}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderMetricView('orders')}
                    className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                      orderMetricView === 'orders'
                        ? 'bg-cockpit-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                    }`}
                  >
                    {t.orders}
                  </button>
                </div>
              }
            >
              <LineChart
                series={orderVolumeSeries}
                height={chartHeight}
                valueFormat={orderMetricView === 'aov' ? 'currency' : 'integer'}
              />
            </ChartCard>
            <ChartCard compact title={t.expenseComposition}>
              <div className="flex justify-center">
                <PieChart data={topExpenseCategories} size={pieSize} />
              </div>
            </ChartCard>
          </div>

          <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
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
                          ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-200 dark:bg-gray-200 dark:text-gray-900'
                          : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                      }`}
                    >
                      {channel.channelName}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {channelPerformance
                  .filter((channel) => selectedChannels.has(channel.channelId))
                  .map((channel) => (
                    <div
                      key={channel.channelId}
                      className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/30"
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{channel.channelName}</p>
                      <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">₼{channel.grossSales.toFixed(2)}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {channel.orderCount.toFixed(0)} {t.orders} • ₼{channel.avgOrderValue.toFixed(2)} {t.aov} • {(channel.grossMarginPct ?? 0).toFixed(1)}{t.share}
                      </p>
                    </div>
                  ))}
              </div>
            </ChartCard>

            <ChartCard compact title={t.payoutSummaryCard}>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.periodRevenue}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">₼{(payoutReconciliation?.totalExpected ?? 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.payoutReceived}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">₼{(payoutReconciliation?.totalActual ?? 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.impliedCommission}</p>
                  <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                    ₼{Math.max(0, (payoutReconciliation?.totalExpected ?? 0) - (payoutReconciliation?.totalActual ?? 0)).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t.payoutPeriodsInRange.replace('{count}', String(payoutReconciliation?.items?.length ?? 0))}
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
