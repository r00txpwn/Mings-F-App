import type { ExecutiveKpis, MetricDelta, TimeseriesPoint } from '../../types/analytics';
import type { AggregateRecord, ComputeExecutiveKpisInput } from './types';

export function safePct(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return 0;
  }

  return (numerator / denominator) * 100;
}

export function computeExecutiveKpis(input: ComputeExecutiveKpisInput): ExecutiveKpis {
  const discounts = input.discounts ?? 0;
  const refunds = input.refunds ?? 0;

  const netRevenue = input.grossSales - discounts - refunds;
  const grossProfit = netRevenue - input.cogs;
  const operatingProfit = grossProfit - input.opex;

  return {
    grossSales: input.grossSales,
    netRevenue,
    cogs: input.cogs,
    opex: input.opex,
    grossMarginPct: safePct(grossProfit, netRevenue),
    operatingProfit,
    avgOrderValue: input.orderCount > 0 ? netRevenue / input.orderCount : 0,
    orderCount: input.orderCount,
  };
}

export function computeDelta<TValue extends number>(
  current: TValue,
  previous: TValue,
): MetricDelta<TValue> {
  const absoluteChange = current - previous;
  const pctChange = previous === 0 ? null : safePct(absoluteChange, previous);

  return {
    current,
    previous,
    absoluteChange,
    pctChange,
    direction: absoluteChange === 0 ? 'flat' : absoluteChange > 0 ? 'up' : 'down',
  };
}

export function aggregateByDay<
  TRecord extends AggregateRecord,
  TDateField extends keyof TRecord,
  TAmountField extends keyof TRecord,
>(records: TRecord[], dateField: TDateField, amountField: TAmountField): TimeseriesPoint[] {
  const dailyTotals = new Map<string, number>();

  for (const record of records) {
    const rawDate = record[dateField];
    const rawAmount = record[amountField];

    if (rawDate === null || rawDate === undefined || rawAmount === null || rawAmount === undefined) {
      continue;
    }

    const date = rawDate instanceof Date ? rawDate : new Date(String(rawDate));
    const amount = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount);

    if (!Number.isFinite(date.getTime()) || !Number.isFinite(amount)) {
      continue;
    }

    // Normalize to UTC date key to avoid locale-dependent bucket drift.
    const dayKey = date.toISOString().slice(0, 10);
    const existing = dailyTotals.get(dayKey) ?? 0;
    dailyTotals.set(dayKey, existing + amount);
  }

  return Array.from(dailyTotals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodStart, value]) => ({
      periodStart,
      granularity: 'day',
      value,
    }));
}
