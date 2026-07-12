import { describe, expect, it } from 'vitest';
import {
  addRowToGroupOrderCount,
  computeEffectiveOrderCount,
  effectiveOrderCountForRow,
  getGroupOrderCount,
} from '../../src/services/analytics/orderCount';

describe('orderCount', () => {
  it('manual row uses quantity as order count', () => {
    expect(effectiveOrderCountForRow({ id: 'a', source: 'manual', quantity: 5 })).toBe(5);
  });

  it('digital row counts as 1 order regardless of item quantity', () => {
    expect(effectiveOrderCountForRow({ id: 'b', source: 'kiosk', quantity: 3 })).toBe(1);
  });

  it('null source treated as manual', () => {
    expect(effectiveOrderCountForRow({ id: 'c', source: null, quantity: 4 })).toBe(4);
  });

  it('computeEffectiveOrderCount sums manual qty and distinct digital ids', () => {
    const rows = [
      { id: '1', source: 'manual', quantity: 5 },
      { id: '2', source: 'kiosk', quantity: 3 },
      { id: '3', source: 'online_delivery', quantity: 2 },
      { id: '2', source: 'kiosk', quantity: 1 },
    ];
    expect(computeEffectiveOrderCount(rows)).toBe(7);
  });

  it('bucket counts manual quantity plus digital per day', () => {
    const accumulators = new Map();
    addRowToGroupOrderCount(accumulators, '2026-07-01', {
      id: '1',
      source: 'manual',
      quantity: 3,
    });
    addRowToGroupOrderCount(accumulators, '2026-07-01', {
      id: '2',
      source: 'kiosk',
      quantity: 5,
    });
    expect(getGroupOrderCount(accumulators, '2026-07-01')).toBe(4);
  });

  it('group counts channel manual qty correctly', () => {
    const accumulators = new Map();
    addRowToGroupOrderCount(accumulators, 'ch-1', {
      id: '1',
      source: 'manual',
      quantity: 2,
    });
    addRowToGroupOrderCount(accumulators, 'ch-1', {
      id: '2',
      source: 'manual',
      quantity: 1,
    });
    expect(getGroupOrderCount(accumulators, 'ch-1')).toBe(3);
  });
});
