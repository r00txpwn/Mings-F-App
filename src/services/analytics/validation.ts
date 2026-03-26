import type { PayoutReconciliationSummary } from '../../types/analytics';

export type ValidationSeverity = 'warning' | 'error';

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  message: string;
  expected: number;
  actual: number;
  delta: number;
}

export interface AnalyticsValidationInput {
  revenueTotal: number;
  channelRevenueTotal?: number | null;
  netRevenue: number;
  cogs: number;
  opex: number;
  operatingProfit: number;
  payoutReconciliation?: PayoutReconciliationSummary | null;
}

const EPSILON = 0.01;

const isClose = (a: number, b: number, epsilon: number = EPSILON): boolean =>
  Math.abs(a - b) <= epsilon;

const issue = (
  code: string,
  message: string,
  expected: number,
  actual: number,
  severity: ValidationSeverity = 'warning'
): ValidationIssue => ({
  code,
  message,
  severity,
  expected,
  actual,
  delta: actual - expected,
});

export function validateRevenueVsChannels(
  revenueTotal: number,
  channelRevenueTotal?: number | null
): ValidationIssue[] {
  if (channelRevenueTotal === null || channelRevenueTotal === undefined) {
    return [];
  }
  if (isClose(revenueTotal, channelRevenueTotal)) {
    return [];
  }
  return [
    issue(
      'revenue_channel_total_mismatch',
      'Revenue total does not match summed channel revenue.',
      revenueTotal,
      channelRevenueTotal
    ),
  ];
}

export function validateNetFormula(
  netRevenue: number,
  cogs: number,
  opex: number,
  operatingProfit: number
): ValidationIssue[] {
  const expectedOperatingProfit = netRevenue - cogs - opex;
  if (isClose(expectedOperatingProfit, operatingProfit)) {
    return [];
  }
  return [
    issue(
      'net_formula_mismatch',
      'Operating profit is inconsistent with net - COGS - OPEX.',
      expectedOperatingProfit,
      operatingProfit,
      'error'
    ),
  ];
}

export function validatePayoutReconciliationTotals(
  payoutReconciliation?: PayoutReconciliationSummary | null
): ValidationIssue[] {
  if (!payoutReconciliation) {
    return [];
  }

  const issues: ValidationIssue[] = [];
  const summedExpected = payoutReconciliation.items.reduce((sum, item) => sum + item.expectedAmount, 0);
  const summedActual = payoutReconciliation.items.reduce((sum, item) => sum + item.actualAmount, 0);
  const summedDifference = payoutReconciliation.items.reduce((sum, item) => sum + item.difference, 0);

  if (!isClose(payoutReconciliation.totalExpected, summedExpected)) {
    issues.push(
      issue(
        'payout_expected_total_mismatch',
        'Payout expected total does not equal summed expected line items.',
        summedExpected,
        payoutReconciliation.totalExpected
      )
    );
  }

  if (!isClose(payoutReconciliation.totalActual, summedActual)) {
    issues.push(
      issue(
        'payout_actual_total_mismatch',
        'Payout actual total does not equal summed actual line items.',
        summedActual,
        payoutReconciliation.totalActual
      )
    );
  }

  if (!isClose(payoutReconciliation.totalDifference, summedDifference)) {
    issues.push(
      issue(
        'payout_difference_sum_mismatch',
        'Payout difference total does not equal summed line-item differences.',
        summedDifference,
        payoutReconciliation.totalDifference
      )
    );
  }

  const expectedDifference = payoutReconciliation.totalActual - payoutReconciliation.totalExpected;
  if (!isClose(payoutReconciliation.totalDifference, expectedDifference)) {
    issues.push(
      issue(
        'payout_difference_formula_mismatch',
        'Payout difference total is inconsistent with actual - expected.',
        expectedDifference,
        payoutReconciliation.totalDifference,
        'error'
      )
    );
  }

  return issues;
}

export function validateAnalyticsSnapshot(input: AnalyticsValidationInput): ValidationIssue[] {
  return [
    ...validateRevenueVsChannels(input.revenueTotal, input.channelRevenueTotal),
    ...validateNetFormula(input.netRevenue, input.cogs, input.opex, input.operatingProfit),
    ...validatePayoutReconciliationTotals(input.payoutReconciliation),
  ];
}
