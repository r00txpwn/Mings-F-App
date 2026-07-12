import { useMemo } from 'react';
import { BarChart } from '../BarChart';
import { DonutChart } from '../DonutChart';
import { HorizontalBarChart } from '../HorizontalBarChart';
import { LineChart } from '../LineChart';
import { ChartCard, KpiCard } from '../analytics';
import { HomeDetailsSection } from './HomeDetailsSection';
import { useLanguage } from '../../contexts/LanguageContext';
import type { HomeDashboardViewProps, HomeKpiCard } from './homeDashboardTypes';

export function FinanceTab({
  loading,
  kpis,
  previousKpis,
  comparePrevious,
  deltaFor,
  trendData,
  channelPerformance,
  expenseBreakdown,
  payoutReconciliation,
  groupA,
  accountBalances,
  outstandingDebt,
}: HomeDashboardViewProps) {
  const { t } = useLanguage();
  const prev = previousKpis;

  const financeCards = useMemo(
    (): HomeKpiCard[] => [
      {
        label: t.operatingProfitLabel,
        value: `₼${kpis.operatingProfit.toFixed(2)}`,
        subtitle: t.kpiOperatingProfitHint,
        delta: comparePrevious ? deltaFor(kpis.operatingProfit, prev?.operatingProfit) : undefined,
        trendOverride: kpis.operatingProfit >= 0 ? 'up' : 'down',
      },
      {
        label: t.staffSalariesLabel,
        value: `₼${kpis.payroll.toFixed(2)}`,
        subtitle: t.staffSalariesHint,
        delta: comparePrevious ? deltaFor(kpis.payroll, prev?.payroll) : undefined,
        trendOverride: 'neutral' as const,
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
    ],
    [accountBalances, comparePrevious, deltaFor, kpis, outstandingDebt, prev, t],
  );

  const purchaseSplitDonut = useMemo(() => {
    const split = groupA?.purchasePaymentSplit;
    if (!split) return [];
    return [
      { label: t.creditPurchases, value: split.creditAmount, color: '#f43f5e' },
      { label: t.cashPurchases, value: split.cashAmount, color: '#22c55e' },
      { label: t.cardPayments, value: split.cardAmount, color: '#3b82f6' },
      { label: t.accountBank, value: split.bankAmount, color: '#8b5cf6' },
    ].filter((s) => s.value > 0);
  }, [groupA?.purchasePaymentSplit, t]);

  const payrollBarSeries = useMemo(
    () => [
      {
        label: t.staffSalariesLabel,
        color: '#fbbf24',
        data: (groupA?.payrollTrend ?? []).map((p) => ({ label: p.bucket, value: p.salary })),
      },
      {
        label: t.payrollAdvance,
        color: '#f59e0b',
        data: (groupA?.payrollTrend ?? []).map((p) => ({ label: p.bucket, value: p.advance })),
      },
    ],
    [groupA?.payrollTrend, t],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <KpiCard key={i} label={t.netProfit} value="--" loading />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {financeCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            subtitle={card.subtitle}
            delta={'delta' in card ? card.delta?.text : undefined}
            trend={
              'trendOverride' in card && card.trendOverride
                ? card.trendOverride
                : 'delta' in card
                  ? card.delta?.trend ?? 'neutral'
                  : 'neutral'
            }
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
        <ChartCard compact title={t.revenueVsCostsTrend}>
          <LineChart
            series={[
              {
                label: t.revenueLabel,
                color: '#fbbf24',
                data: trendData.map((d) => ({ date: d.bucket, value: d.revenue })),
              },
              {
                label: t.purchaseCostLabel,
                color: '#f59e0b',
                data: trendData.map((d) => ({ date: d.bucket, value: d.purchaseCost })),
              },
              {
                label: t.operationalExpenseLabel,
                color: '#f43f5e',
                data: trendData.map((d) => ({ date: d.bucket, value: d.operationalExpense })),
              },
            ]}
            height={220}
          />
        </ChartCard>
        <ChartCard compact title={t.salesByChannel}>
          <HorizontalBarChart
            items={channelPerformance.map((ch, i) => ({
              label: ch.channelName,
              value: ch.grossSales,
              subtitle: `${ch.orderCount.toFixed(0)} ${t.orders}`,
              color: ['#fbbf24', '#f59e0b', '#d97706', '#b45309'][i % 4],
            }))}
          />
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <ChartCard compact title={t.cogsByCategory}>
          <HorizontalBarChart items={groupA?.cogsByCategory ?? []} />
        </ChartCard>
        <ChartCard compact title={t.spendBySupplier}>
          <HorizontalBarChart items={groupA?.spendBySupplier ?? []} />
        </ChartCard>
        <ChartCard compact title={t.opexByCategory}>
          <HorizontalBarChart items={groupA?.opexByCategory ?? []} />
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <ChartCard compact title={t.commissionByChannel}>
          <HorizontalBarChart items={groupA?.commissionByChannel ?? []} />
        </ChartCard>
        <ChartCard compact title={t.purchasePaymentSplit}>
          <DonutChart data={purchaseSplitDonut} centerLabel={t.cogs} />
        </ChartCard>
        <ChartCard compact title={t.payrollTrend}>
          <BarChart series={payrollBarSeries} height={200} />
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <ChartCard compact title={t.aovDistribution}>
          <BarChart
            series={[
              {
                label: t.orders,
                color: '#d97706',
                data: (groupA?.aovBuckets ?? []).map((b) => ({ label: b.label, value: b.count })),
              },
            ]}
            height={180}
            valueFormat="integer"
          />
        </ChartCard>
        <ChartCard compact title={t.discountTipTrend}>
          <LineChart
            series={[
              {
                label: t.discountsLabel,
                color: '#f43f5e',
                data: (groupA?.discountTipTrend ?? []).map((d) => ({
                  date: d.bucket,
                  value: d.discounts,
                })),
              },
              {
                label: t.tipsLabel,
                color: '#22c55e',
                data: (groupA?.discountTipTrend ?? []).map((d) => ({
                  date: d.bucket,
                  value: d.tips,
                })),
              },
            ]}
            height={180}
          />
        </ChartCard>
      </div>

      <HomeDetailsSection expenseBreakdown={expenseBreakdown} payoutReconciliation={payoutReconciliation} />
    </>
  );
}
