import { useMemo } from 'react';
import { BarChart } from '../BarChart';
import { Heatmap } from '../Heatmap';
import { HorizontalBarChart } from '../HorizontalBarChart';
import { ChartCard } from '../analytics';
import { KpiCard } from '../analytics';
import { DashboardEmptyState } from './DashboardEmptyState';
import { useLanguage } from '../../contexts/LanguageContext';
import type { HomeDashboardViewProps } from './homeDashboardTypes';

export function KitchenOpsTab({
  loading,
  operationalData,
  groupA,
  weekdayLabels,
}: HomeDashboardViewProps) {
  const { t } = useLanguage();
  const prep = operationalData?.prepTime;
  const hasPrepData = (prep?.ordersWithPrep ?? 0) > 0;
  const hasHourlyData = (operationalData?.hourlyDemand ?? []).some((h) => h.orderCount > 0);

  const hourlyBarSeries = useMemo(
    () => [
      {
        label: t.orders,
        color: '#d97706',
        data: (operationalData?.hourlyDemand ?? [])
          .filter((h) => h.hour >= 10 && h.hour <= 22)
          .map((h) => ({
            label: `${String(h.hour).padStart(2, '0')}:00`,
            value: h.orderCount,
          })),
      },
    ],
    [operationalData?.hourlyDemand, t.orders],
  );

  const busiestHour = useMemo(() => {
    const hours = operationalData?.hourlyDemand ?? [];
    if (hours.length === 0) return null;
    const top = [...hours].sort((a, b) => b.orderCount - a.orderCount)[0];
    return top.orderCount > 0 ? `${String(top.hour).padStart(2, '0')}:00` : null;
  }, [operationalData?.hourlyDemand]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCard key={i} label={t.avgPrepTime} value="--" loading />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t.avgPrepTime}
          value={prep?.avgPrepMinutes != null ? `${prep.avgPrepMinutes.toFixed(0)}m` : '—'}
          subtitle={hasPrepData ? `${prep?.ordersWithPrep ?? 0} ${t.orders}` : t.dashboardEmptyKitchenOps}
        />
        <KpiCard
          label={t.kitchenSla}
          value={prep?.slaMetPct != null ? `${prep.slaMetPct.toFixed(0)}%` : '—'}
          subtitle={t.dashboardSlaHint}
        />
        <KpiCard
          label={t.peakHours}
          value={busiestHour ?? '—'}
          subtitle={t.dashboardBusiestHourHint}
        />
        <KpiCard
          label={t.orders}
          value={String(
            (groupA?.weekdayDemand ?? []).reduce((sum, d) => sum + d.orderCount, 0),
          )}
          subtitle={t.dashboardOrdersHint}
        />
      </div>

      {!hasPrepData ? (
        <div className="mt-4">
          <DashboardEmptyState message={t.dashboardEmptyKitchenOps} />
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
        <ChartCard compact title={t.demandHeatmap}>
          <Heatmap
            cells={(groupA?.demandHeatmap ?? []).map((c) => ({
              weekday: c.weekday,
              hour: c.hour,
              value: c.orderCount,
            }))}
            weekdayLabels={weekdayLabels}
            valueLabel={t.orders}
          />
        </ChartCard>
        <ChartCard compact title={t.peakHours}>
          {hasHourlyData ? (
            <BarChart series={hourlyBarSeries} height={220} valueFormat="integer" />
          ) : (
            <DashboardEmptyState message={t.noDataForPeriod} />
          )}
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <ChartCard compact title={t.weekdayDemand}>
          <BarChart
            series={[
              {
                label: t.revenueLabel,
                color: '#fbbf24',
                data: (groupA?.weekdayDemand ?? []).map((d) => ({
                  label: weekdayLabels[d.weekday] ?? String(d.weekday),
                  value: d.revenue,
                })),
              },
            ]}
            height={200}
          />
        </ChartCard>
        <ChartCard compact title={t.topProducts}>
          <HorizontalBarChart
            items={(operationalData?.topProducts ?? []).map((p) => ({
              label: p.productName,
              value: p.quantity,
              subtitle: `₼${p.revenue.toFixed(2)}`,
            }))}
            valueFormat="integer"
          />
        </ChartCard>
      </div>
    </>
  );
}
