export interface ComputeExecutiveKpisInput {
  grossSales: number;
  discounts?: number;
  refunds?: number;
  cogs: number;
  opex: number;
  bankFees?: number;
  payroll?: number;
  /** Implied platform commissions (gross − payout) for entered payouts in period. */
  platformCommissions?: number;
  orderCount: number;
}

export type AggregateRecord = Record<string, unknown>;
