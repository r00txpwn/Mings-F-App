export interface ComputeExecutiveKpisInput {
  grossSales: number;
  discounts?: number;
  refunds?: number;
  cogs: number;
  opex: number;
  bankFees?: number;
  salesTax?: number;
  payroll?: number;
  employerContributions?: number;
  orderCount: number;
}

export type AggregateRecord = Record<string, unknown>;
