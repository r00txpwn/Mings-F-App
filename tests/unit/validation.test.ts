import { describe, it, expect } from 'vitest';
import {
  validateRevenueVsChannels,
  validateNetFormula,
  validatePayoutReconciliationTotals,
  validateAnalyticsSnapshot,
} from '../../src/services/analytics/validation';
import type { PayoutReconciliationSummary } from '../../src/types/analytics';

describe('validateRevenueVsChannels', () => {
  it('returns no issues when totals match within epsilon', () => {
    expect(validateRevenueVsChannels(1000, 1000)).toHaveLength(0);
    expect(validateRevenueVsChannels(1000, 1000.005)).toHaveLength(0);
  });

  it('returns mismatch issue when totals differ beyond epsilon', () => {
    const issues = validateRevenueVsChannels(1000, 990);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('revenue_channel_total_mismatch');
    expect(issues[0].severity).toBe('warning');
  });

  it('returns no issues when channelTotal is null/undefined', () => {
    expect(validateRevenueVsChannels(1000, null)).toHaveLength(0);
    expect(validateRevenueVsChannels(1000, undefined)).toHaveLength(0);
  });
});

describe('validateNetFormula', () => {
  it('returns no issues for consistent data', () => {
    // netRevenue - cogs - opex = operatingProfit
    expect(validateNetFormula(9300, 3000, 2000, 4300)).toHaveLength(0);
  });

  it('returns error when operating profit is inconsistent', () => {
    const issues = validateNetFormula(9300, 3000, 2000, 5000); // should be 4300
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('net_formula_mismatch');
    expect(issues[0].severity).toBe('error');
    expect(issues[0].expected).toBeCloseTo(4300, 1);
    expect(issues[0].actual).toBe(5000);
    expect(issues[0].delta).toBeCloseTo(700, 1);
  });

  it('handles negative operating profit correctly', () => {
    expect(validateNetFormula(1000, 800, 400, -200)).toHaveLength(0);
  });
});

describe('validatePayoutReconciliationTotals', () => {
  it('returns no issues for null/undefined input', () => {
    expect(validatePayoutReconciliationTotals(null)).toHaveLength(0);
    expect(validatePayoutReconciliationTotals(undefined)).toHaveLength(0);
  });

  it('returns no issues for consistent payout data', () => {
    const payout: PayoutReconciliationSummary = {
      totalExpected: 1000,
      totalActual: 950,
      totalDifference: -50,
      items: [
        { salesChannelId: 'ch1', channelName: 'Wolt', expectedAmount: 600, actualAmount: 570, difference: -30, status: 'underpaid' },
        { salesChannelId: 'ch2', channelName: 'Direct', expectedAmount: 400, actualAmount: 380, difference: -20, status: 'underpaid' },
      ],
    };
    expect(validatePayoutReconciliationTotals(payout)).toHaveLength(0);
  });

  it('reports all mismatches for inconsistent payout data', () => {
    const payout: PayoutReconciliationSummary = {
      totalExpected: 999,   // wrong — should be 1000
      totalActual: 950,
      totalDifference: -50,
      items: [
        { salesChannelId: 'ch1', channelName: 'Wolt', expectedAmount: 600, actualAmount: 570, difference: -30, status: 'underpaid' },
        { salesChannelId: 'ch2', channelName: 'Direct', expectedAmount: 400, actualAmount: 380, difference: -20, status: 'underpaid' },
      ],
    };
    const issues = validatePayoutReconciliationTotals(payout);
    const codes = issues.map((i) => i.code);
    expect(codes).toContain('payout_expected_total_mismatch');
  });
});

describe('validateAnalyticsSnapshot', () => {
  it('returns empty array for fully consistent snapshot', () => {
    const issues = validateAnalyticsSnapshot({
      revenueTotal: 9300,
      channelRevenueTotal: 9300,
      netRevenue: 9300,
      cogs: 3000,
      opex: 2000,
      operatingProfit: 4300,
    });
    expect(issues).toHaveLength(0);
  });

  it('aggregates issues from all validators', () => {
    const issues = validateAnalyticsSnapshot({
      revenueTotal: 9300,
      channelRevenueTotal: 8000,  // mismatch — should trigger warning
      netRevenue: 9300,
      cogs: 3000,
      opex: 2000,
      operatingProfit: 9999,      // wrong — should trigger error
    });
    const codes = issues.map((i) => i.code);
    expect(codes).toContain('revenue_channel_total_mismatch');
    expect(codes).toContain('net_formula_mismatch');
    expect(issues.some((i) => i.severity === 'error')).toBe(true);
  });
});
