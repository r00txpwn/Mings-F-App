import type { TaxSettings } from '../../lib/supabase';

export interface SalesTaxBreakdown {
  cashTurnover: number;
  nonCashTurnover: number;
  cashTax: number;
  nonCashTax: number;
  totalTax: number;
}

export function computeSalesTax(
  cashTurnover: number,
  nonCashTurnover: number,
  settings: TaxSettings,
): SalesTaxBreakdown {
  const cash = Math.max(0, cashTurnover);
  const nonCash = Math.max(0, nonCashTurnover);
  const cashTax = (cash * settings.sales_tax_cash_pct) / 100;
  const nonCashTax = (nonCash * settings.sales_tax_noncash_pct) / 100;

  return {
    cashTurnover: cash,
    nonCashTurnover: nonCash,
    cashTax,
    nonCashTax,
    totalTax: cashTax + nonCashTax,
  };
}

/** Classify sale turnover as cash vs non-cash for simplified tax rates. */
export function classifySalePaymentMethod(
  onlinePaymentMethod: string | null | undefined,
): 'cash' | 'non_cash' {
  const method = String(onlinePaymentMethod ?? '').toLowerCase();
  if (
    method.includes('card') ||
    method === 'epoint' ||
    method === 'online' ||
    method.includes('pos') ||
    method.includes('terminal')
  ) {
    return 'non_cash';
  }
  if (method.includes('cod') || method.includes('cash')) {
    return 'cash';
  }
  // Default: treat unknown/manual partner sales as cash turnover
  return 'cash';
}
