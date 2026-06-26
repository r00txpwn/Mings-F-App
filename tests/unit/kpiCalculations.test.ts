import { describe, it, expect } from 'vitest';
import {
  safePct,
  computeExecutiveKpis,
  computeDelta,
  aggregateByDay,
} from '../../src/services/analytics/kpiCalculations';

describe('safePct', () => {
  it('returns correct percentage', () => {
    expect(safePct(25, 100)).toBe(25);
    expect(safePct(1, 3)).toBeCloseTo(33.33, 1);
  });

  it('returns 0 when denominator is zero', () => {
    expect(safePct(100, 0)).toBe(0);
  });

  it('returns 0 for non-finite inputs', () => {
    expect(safePct(Infinity, 100)).toBe(0);
    expect(safePct(100, NaN)).toBe(0);
    expect(safePct(NaN, NaN)).toBe(0);
  });
});

describe('computeExecutiveKpis', () => {
  it('computes all KPIs correctly', () => {
    const result = computeExecutiveKpis({
      grossSales: 10000,
      discounts: 500,
      refunds: 200,
      cogs: 3000,
      opex: 2000,
      orderCount: 50,
    });

    expect(result.grossSales).toBe(10000);
    expect(result.netRevenue).toBe(9300);       // 10000 - 500 - 200
    expect(result.cogs).toBe(3000);
    expect(result.opex).toBe(2000);
    expect(result.operatingProfit).toBe(4300);  // 9300 - 3000 - 2000
    expect(result.bankFees).toBe(0);
    expect(result.netProfit).toBe(4300);
    expect(result.avgOrderValue).toBe(186);     // 9300 / 50
    expect(result.orderCount).toBe(50);
    expect(result.grossMarginPct).toBeCloseTo(safePct(9300 - 3000, 9300), 5);
  });

  it('defaults discounts and refunds to 0 when omitted', () => {
    const result = computeExecutiveKpis({
      grossSales: 5000,
      cogs: 1000,
      opex: 500,
      orderCount: 10,
    });
    expect(result.netRevenue).toBe(5000);
  });

  it('returns avgOrderValue of 0 when orderCount is 0', () => {
    const result = computeExecutiveKpis({
      grossSales: 1000,
      cogs: 0,
      opex: 0,
      orderCount: 0,
    });
    expect(result.avgOrderValue).toBe(0);
  });

  it('deducts bank fees for net profit only', () => {
    const result = computeExecutiveKpis({
      grossSales: 10000,
      cogs: 3000,
      opex: 2000,
      bankFees: 50,
      orderCount: 10,
    });
    expect(result.operatingProfit).toBe(5000);
    expect(result.netProfit).toBe(4950);
  });

  it('handles negative operating profit (loss scenario)', () => {
    const result = computeExecutiveKpis({
      grossSales: 1000,
      cogs: 800,
      opex: 400,
      orderCount: 5,
    });
    expect(result.operatingProfit).toBe(-200);
    expect(result.netProfit).toBe(-200);
  });
});

describe('computeDelta', () => {
  it('correctly detects up direction', () => {
    const d = computeDelta(120, 100);
    expect(d.direction).toBe('up');
    expect(d.absoluteChange).toBe(20);
    expect(d.pctChange).toBeCloseTo(20, 5);
  });

  it('correctly detects down direction', () => {
    const d = computeDelta(80, 100);
    expect(d.direction).toBe('down');
    expect(d.absoluteChange).toBe(-20);
    expect(d.pctChange).toBeCloseTo(-20, 5);
  });

  it('correctly detects flat direction', () => {
    const d = computeDelta(100, 100);
    expect(d.direction).toBe('flat');
    expect(d.absoluteChange).toBe(0);
    expect(d.pctChange).toBe(0);
  });

  it('returns null pctChange when previous is 0', () => {
    const d = computeDelta(50, 0);
    expect(d.pctChange).toBeNull();
    expect(d.direction).toBe('up');
  });
});

describe('aggregateByDay', () => {
  it('groups records by UTC date and sums amounts', () => {
    const records = [
      { created_at: '2024-03-01T10:00:00Z', amount: 100 },
      { created_at: '2024-03-01T18:00:00Z', amount: 200 },
      { created_at: '2024-03-02T09:00:00Z', amount: 50 },
    ];
    const result = aggregateByDay(records, 'created_at', 'amount');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ periodStart: '2024-03-01', value: 300, granularity: 'day' });
    expect(result[1]).toMatchObject({ periodStart: '2024-03-02', value: 50, granularity: 'day' });
  });

  it('returns sorted ascending result', () => {
    const records = [
      { d: '2024-03-05', v: 10 },
      { d: '2024-03-01', v: 20 },
      { d: '2024-03-03', v: 30 },
    ];
    const result = aggregateByDay(records, 'd', 'v');
    const dates = result.map((r) => r.periodStart);
    expect(dates).toEqual([...dates].sort());
  });

  it('skips records with null/undefined date or amount', () => {
    const records = [
      { d: null, v: 100 },
      { d: '2024-03-01', v: null },
      { d: '2024-03-01', v: 50 },
    ];
    const result = aggregateByDay(records as never, 'd', 'v');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(50);
  });

  it('returns empty array for empty input', () => {
    expect(aggregateByDay([], 'date', 'amount')).toEqual([]);
  });
});
