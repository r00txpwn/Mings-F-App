import type { ExecutiveKpis, MetricDelta, TimeseriesPoint } from '../../types/analytics';
import type { AggregateRecord, ComputeExecutiveKpisInput } from './types';

export const ASSUMED_PLATFORM_COMMISSION_RATE = 0.35;

export type PlatformCommissionSale = {
  salesChannelId: string | null;
  saleDate: string;
  grossSales: number;
};

export type PlatformCommissionPayout = {
  salesChannelId: string;
  periodStart: string;
  periodEnd: string;
  expectedAmount: number;
  actualAmount: number;
};

export type PlatformCommissionSummary = {
  actualCommission: number;
  estimatedCommission: number;
  totalCommission: number;
  estimatedSales: number;
  usesEstimate: boolean;
};

export type ConfiguredSalaryEmployee = {
  totalSalary: number | string | null;
  isActive: boolean;
};

const clampRate = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Monthly payroll obligation used by profitability reporting.
 * Payment history is intentionally excluded so advances, missed payments, and
 * overpayments cannot distort the salary expense.
 */
export function computeConfiguredPayroll(employees: ConfiguredSalaryEmployee[]): number {
  return employees.reduce((total, employee) => {
    if (!employee.isActive) return total;
    const salary = Number(employee.totalSalary);
    return Number.isFinite(salary) && salary > 0 ? total + salary : total;
  }, 0);
}

export function computePlatformCommissionSummary(input: {
  sales: PlatformCommissionSale[];
  payouts: PlatformCommissionPayout[];
  commissionChannelIds: string[];
  commissionExemptChannelIds?: string[];
  assumedRate?: number;
}): PlatformCommissionSummary {
  const commissionChannels = new Set(input.commissionChannelIds);
  const exemptChannels = new Set(input.commissionExemptChannelIds ?? []);
  const assumedRate = clampRate(input.assumedRate ?? ASSUMED_PLATFORM_COMMISSION_RATE);
  let actualCommission = 0;
  let estimatedCommission = 0;
  let estimatedSales = 0;

  for (const sale of input.sales) {
    const channelId = sale.salesChannelId;
    const grossSales = Number.isFinite(sale.grossSales) ? Math.max(0, sale.grossSales) : 0;
    if (!channelId || grossSales <= 0 || !commissionChannels.has(channelId) || exemptChannels.has(channelId)) {
      continue;
    }

    const saleDate = sale.saleDate.split('T')[0];
    const payout = input.payouts.find(
      (item) =>
        item.salesChannelId === channelId &&
        item.actualAmount > 0 &&
        saleDate >= item.periodStart &&
        saleDate <= item.periodEnd,
    );

    if (!payout) {
      estimatedSales += grossSales;
      estimatedCommission += grossSales * assumedRate;
      continue;
    }

    const effectiveRate =
      payout.expectedAmount > 0
        ? clampRate((payout.expectedAmount - payout.actualAmount) / payout.expectedAmount)
        : 0;
    actualCommission += grossSales * effectiveRate;
  }

  return {
    actualCommission,
    estimatedCommission,
    totalCommission: actualCommission + estimatedCommission,
    estimatedSales,
    usesEstimate: estimatedSales > 0,
  };
}

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
  const bankFees = input.bankFees ?? 0;
  const payroll = input.payroll ?? 0;
  const platformCommissions = input.platformCommissions ?? 0;
  const netProfit = operatingProfit - bankFees - payroll - platformCommissions;

  return {
    grossSales: input.grossSales,
    netRevenue,
    cogs: input.cogs,
    opex: input.opex,
    grossMarginPct: safePct(grossProfit, netRevenue),
    foodCostPct: safePct(input.cogs, netRevenue),
    operatingProfit,
    bankFees,
    payroll,
    platformCommissions,
    netProfit,
    netProfitPct: safePct(netProfit, netRevenue),
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
