export interface ComputeExecutiveKpisInput {
  grossSales: number;
  discounts?: number;
  refunds?: number;
  cogs: number;
  opex: number;
  orderCount: number;
}

export type AggregateRecord = Record<string, unknown>;
