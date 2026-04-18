import { describe, it, expect } from 'vitest';
import { pointInPolygon, findZoneForPoint } from '../../src/services/deliveryZones';
import type { DeliveryZoneRow } from '../../src/types/online';

// Simple square zone: [28.9, 40.9] → [29.1, 40.9] → [29.1, 41.1] → [28.9, 41.1]
const SQUARE_RING: number[][] = [
  [28.9, 40.9],
  [29.1, 40.9],
  [29.1, 41.1],
  [28.9, 41.1],
  [28.9, 40.9], // closed ring
];

describe('pointInPolygon', () => {
  it('returns true for a point inside the polygon', () => {
    expect(pointInPolygon(29.0, 41.0, SQUARE_RING)).toBe(true);
  });

  it('returns false for a point outside the polygon', () => {
    expect(pointInPolygon(28.5, 41.0, SQUARE_RING)).toBe(false);
    expect(pointInPolygon(29.5, 41.0, SQUARE_RING)).toBe(false);
    expect(pointInPolygon(29.0, 40.5, SQUARE_RING)).toBe(false);
    expect(pointInPolygon(29.0, 41.5, SQUARE_RING)).toBe(false);
  });

  it('returns false for an empty or too-small ring', () => {
    expect(pointInPolygon(29.0, 41.0, [])).toBe(false);
    expect(pointInPolygon(29.0, 41.0, [[29.0, 41.0], [29.1, 41.1]])).toBe(false);
  });

  it('handles horizontal edges without dividing by zero', () => {
    // Horizontal edges have denom === 0, should be skipped safely
    const ringWithHorizontalEdge: number[][] = [
      [28.9, 41.0],
      [29.1, 41.0], // horizontal edge (same lat)
      [29.1, 41.1],
      [28.9, 41.1],
      [28.9, 41.0],
    ];
    expect(() => pointInPolygon(29.0, 41.05, ringWithHorizontalEdge)).not.toThrow();
  });
});

describe('findZoneForPoint', () => {
  const zone1: DeliveryZoneRow = {
    id: 'zone-1',
    name: 'Inner Baku',
    delivery_fee: 3,
    is_active: true,
    polygon: { type: 'Polygon', coordinates: [SQUARE_RING] },
    min_order_amount: 0,
  };

  const zone2: DeliveryZoneRow = {
    id: 'zone-2',
    name: 'Outer Baku',
    delivery_fee: 5,
    is_active: true,
    polygon: {
      type: 'Polygon',
      coordinates: [[
        [28.5, 40.5],
        [29.5, 40.5],
        [29.5, 41.5],
        [28.5, 41.5],
        [28.5, 40.5],
      ]],
    },
    min_order_amount: 0,
  };

  it('returns the first matching zone for a point inside', () => {
    const result = findZoneForPoint(29.0, 41.0, [zone1, zone2]);
    expect(result?.id).toBe('zone-1');
  });

  it('falls through to next zone when point is outside first', () => {
    const result = findZoneForPoint(28.7, 40.7, [zone1, zone2]);
    expect(result?.id).toBe('zone-2');
  });

  it('returns null when point matches no zone', () => {
    expect(findZoneForPoint(30.0, 42.0, [zone1])).toBeNull();
  });

  it('returns null for empty zones array', () => {
    expect(findZoneForPoint(29.0, 41.0, [])).toBeNull();
  });

  it('skips zones with missing polygon data', () => {
    const noPolygon = { ...zone1, polygon: null } as unknown as DeliveryZoneRow;
    expect(findZoneForPoint(29.0, 41.0, [noPolygon])).toBeNull();
  });
});
