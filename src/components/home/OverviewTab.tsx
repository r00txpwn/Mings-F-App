import { useMemo, useState } from 'react';
import { BarChart } from '../BarChart';
import { DonutChart } from '../DonutChart';
import { HorizontalBarChart } from '../HorizontalBarChart';
import { LineChart } from '../LineChart';
import { ChartCard, KpiCard } from '../analytics';
import { OperationalStrip } from './OperationalStrip';
import { SectionHeader } from '../ui/SectionHeader';
import { useLanguage } from '../../contexts/LanguageContext';
import type { HomeDashboardViewProps, HomeKpiCard } from './homeDashboardTypes';

export function OverviewTab({
  loading,
  kpis,
  trendData,
  operationalData,
  payoutReconciliation,
  groupA,
  weekdayLabels,
  deltaFor,
  previousKpis,
  comparePrevious,
}: HomeDashboardViewProps) {
  const { t } = useLanguage();
  const [orderMetricView, setOrderMetricView] = useState<'aov' | 'orders'>('orders');
  const prev = previousKpis;

  const overviewCards = useMemo(
    (): HomeKpiCard[] => [
      {
        label: t.netRevenueLabel,
        value: `₼${kpis.netRevenue.toFixed(2)}`,
        subtitle: t.kpiNetRevenueHint,
        delta: comparePrevious ? deltaFor(kpis.netRevenue, prev?.netRevenue) : undefined,
      },
      {
        label: t.orders,
        value: kpis.orderCount.toFixed(0),
        subtitle: t.dashboardOrdersHint,
        delta: comparePrevious ? deltaFor(kpis.orderCount, prev?.orderCount) : undefined,
      },
      {
        label: t.aov,
        value: `₼${kpis.avgOrderValue.toFixed(2)}`,
        subtitle: t.dashboardAovHint,
        delta: comparePrevious ? deltaFor(kpis.avgOrderValue, prev?.avgOrderValue) : undefined,
      },
      {
        label: t.grossMarginLabel,
        value: `${kpis.grossMarginPct.toFixed(1)}%`,
        subtitle: `COGS ₼${kpis.cogs.toFixed(2)} • OPEX ₼${kpis.opex.toFixed(2)}`,
        delta: comparePrevious ? deltaFor(kpis.grossMarginPct, prev?.grossMarginPct) : undefined,
        trendOverride: kpis.grossMarginPct >= 35 ? 'up' : kpis.grossMarginPct >= 20 ? 'neutral' : 'down',
      },
      {
        label: t.netProfitLabel,
        value: `₼${kpis.netProfit.toFixed(2)}`,
        subtitle: t.kpiNetProfitHintExtended
          .replace('{fees}', kpis.bankFees.toFixed(2))
          .replace('{payroll}', kpis.payroll.toFixed(2)),
        delta: comparePrevious ? deltaFor(kpis.netProfit, prev?.netProfit) : undefined,
        trendOverride: kpis.netProfit >= 0 ? 'up' : 'down',
      },
    ],
    [comparePrevious, deltaFor, kpis, prev, t],
  );

  const financeTrendSeries = useMemo(
    () => [
      { label: t.revenueLabel, color: '#fbbf24', data: trendData.map((d) => ({ label: d.bucket, value: d.revenue })) },
      {
        label: t.operationalExpenseLabel,
        color: '#f43f5e',
        data: trendData.map((d) => ({ label: d.bucket, value: d.operationalExpense })),
      },
      {
        label: t.purchaseCostLabel,
        color: '#f59e0b',
        data: trendData.map((d) => ({ label: d.bucket, value: d.purchaseCost })),
      },
    ],
    [trendData, t],
  );

  const orderVolumeSeries = useMemo(() => {
    if (orderMetricView === 'aov') {
      return [
        {
          label: t.aov,
          color: '#fbbf24',
          data: trendData.map((d) => ({
            label: d.bucket,
            value: d.orders > 0 ? d.revenue / d.orders : 0,
          })),
        },
      ];
    }
    return [
      {
        label: t.orders,
        color: '#d97706',
        data: trendData.map((d) => ({ label: d.bucket, value: d.orders })),
      },
    ];
  }, [orderMetricView, trendData, t.aov, t.orders]);

  const weekdayBarSeries = useMemo(
    () => [
      {
        label: t.orders,
        color: '#d97706',
        data: (groupA?.weekdayDemand ?? []).map((d) => ({
          label: weekdayLabels[d.weekday] ?? String(d.weekday),
          value: d.orderCount,
        })),
      },
    ],
    [groupA?.weekdayDemand, t.orders, weekdayLabels],
  );

  const channelDonut = useMemo(
    () =>
      (groupA?.channelMix ?? []).map((item, i) => ({
        label: item.label,
        value: item.value,
        color: item.color ?? ['#fbbf24', '#f59e0b', '#d97706', '#b45309'][i % 4],
      })),
    [groupA?.channelMix],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <KpiCard key={i} label={t.revenueLabel} value="--" loading />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {overviewCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            subtitle={card.subtitle}
            delta={card.delta?.text}
            trend={card.trendOverride ?? card.delta?.trend ?? 'neutral'}
          />
        ))}
      </div>

      <div className="mt-4">
        <SectionHeader title={t.operationalInsights} />
        <OperationalStrip data={operationalData} payout={payoutReconciliation} />
      </div>

      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
        <ChartCard compact title={t.revenueVsCostsTrend}>
          <LineChart
            series={financeTrendSeries.map((s) => ({
              label: s.label,
              color: s.color,
              data: s.data.map((d) => ({ date: d.label, value: d.value })),
            }))}
            height={220}
          />
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
            series={orderVolumeSeries.map((s) => ({
              label: s.label,
              color: s.color,
              data: s.data.map((d) => ({ date: d.label, value: d.value })),
            }))}
            height={220}
            valueFormat={orderMetricView === 'aov' ? 'currency' : 'integer'}
          />
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <ChartCard compact title={t.channelMix}>
          <DonutChart data={channelDonut} centerLabel={t.revenueLabel} />
        </ChartCard>
        <ChartCard compact title={t.weekdayDemand}>
          <BarChart series={weekdayBarSeries} height={200} valueFormat="integer" />
        </ChartCard>
        <ChartCard compact title={t.topProducts}>
          <HorizontalBarChart
            items={(operationalData?.topProducts ?? []).map((p) => ({
              label: p.productName,
              value: p.revenue,
              subtitle: `${p.quantity.toFixed(0)} ${t.orders}`,
            }))}
          />
        </ChartCard>
      </div>
    </>
  );
}
