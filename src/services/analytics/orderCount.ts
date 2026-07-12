/**
 * Order count semantics for analytics:
 * - manual (or null source): sales.quantity = number of orders on that row
 * - digital channels (kiosk, online, POS): one row = one order; quantity = item count
 */

export type OrderCountSaleRow = {
  id?: string | null;
  source?: string | null;
  quantity?: number | string | null;
};

export type OrderCountAccumulator = {
  manualCount: number;
  digitalIds: Set<string>;
  orphanCount: number;
};

const safeNumber = (value: number | string | null | undefined): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export function isManualSource(source: string | null | undefined): boolean {
  return !source || source === 'manual';
}

export function createOrderCountAccumulator(): OrderCountAccumulator {
  return { manualCount: 0, digitalIds: new Set(), orphanCount: 0 };
}

export function addRowToAccumulator(acc: OrderCountAccumulator, row: OrderCountSaleRow): void {
  if (isManualSource(row.source)) {
    acc.manualCount += Math.max(1, safeNumber(row.quantity));
    return;
  }
  if (row.id) {
    acc.digitalIds.add(row.id);
    return;
  }
  acc.orphanCount += 1;
}

export function totalFromAccumulator(acc: OrderCountAccumulator): number {
  return acc.manualCount + acc.digitalIds.size + acc.orphanCount;
}

/** Effective order count for a single sale row. */
export function effectiveOrderCountForRow(row: OrderCountSaleRow): number {
  if (isManualSource(row.source)) {
    return Math.max(1, safeNumber(row.quantity));
  }
  return 1;
}

/** Total order count across all rows (manual sums quantity; digital counts distinct ids). */
export function computeEffectiveOrderCount(rows: OrderCountSaleRow[]): number {
  const acc = createOrderCountAccumulator();
  for (const row of rows) {
    addRowToAccumulator(acc, row);
  }
  return totalFromAccumulator(acc);
}

/** Per-key order count accumulators (bucket, channel, hour, etc.). */
export function addRowToGroupOrderCount(
  groupAccumulators: Map<string, OrderCountAccumulator>,
  groupKey: string,
  row: OrderCountSaleRow,
): void {
  const acc = groupAccumulators.get(groupKey) ?? createOrderCountAccumulator();
  addRowToAccumulator(acc, row);
  groupAccumulators.set(groupKey, acc);
}

export function getGroupOrderCount(
  groupAccumulators: Map<string, OrderCountAccumulator>,
  groupKey: string,
): number {
  const acc = groupAccumulators.get(groupKey);
  return acc ? totalFromAccumulator(acc) : 0;
}
