import { supabase, TAX_SETTINGS_ID, type TaxSettings } from '../../lib/supabase';
import { computePayrollTaxes, prorateEmployerContributions } from './payrollTax';
import { classifySalePaymentMethod, computeSalesTax } from './salesTax';

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  id: TAX_SETTINGS_ID,
  sales_tax_cash_pct: 2,
  sales_tax_noncash_pct: 2,
  pit_exempt_amount: 200,
  pit_bracket1_max: 2500,
  pit_bracket2_max: 8000,
  pit_bracket1_pct: 3,
  pit_bracket2_pct: 10,
  pit_bracket3_pct: 14,
  pit_bracket2_fixed: 75,
  pit_bracket3_fixed: 625,
  dsmf_employee_low_pct: 3,
  dsmf_employee_high_pct: 10,
  dsmf_employee_low_cap: 200,
  dsmf_employer_low_pct: 22,
  dsmf_employer_high_pct: 15,
  dsmf_employer_low_cap: 200,
  dsmf_high_income_cap: 8000,
  dsmf_employee_high_income_pct: 10,
  dsmf_employer_high_income_pct: 11,
  medical_low_cap: 2500,
  medical_employee_low_pct: 1,
  medical_employer_low_pct: 1,
  medical_employee_high_pct: 0.5,
  medical_employer_high_pct: 0.5,
  unemployment_employee_pct: 0.5,
  unemployment_employer_pct: 0.5,
  updated_at: '2026-01-01T00:00:00Z',
};

export async function fetchTaxSettings(): Promise<TaxSettings> {
  const { data, error } = await supabase
    .from('tax_settings')
    .select('*')
    .eq('id', TAX_SETTINGS_ID)
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_TAX_SETTINGS;
  }

  return data as TaxSettings;
}

type SaleTaxRow = {
  total_price: number | string | null;
  online_payment_method?: string | null;
};

type EmployeeRow = {
  official_salary: number | string | null;
  is_active: boolean;
};

export interface PeriodTaxSummary {
  salesTax: number;
  payroll: number;
  employerContributions: number;
  payrollTaxLiability: number;
  cashTurnover: number;
  nonCashTurnover: number;
}

export async function computePeriodTaxSummary(
  startDate: string,
  endDate: string,
  salesRows: SaleTaxRow[],
  settings: TaxSettings = DEFAULT_TAX_SETTINGS,
): Promise<PeriodTaxSummary> {
  let cashTurnover = 0;
  let nonCashTurnover = 0;

  for (const row of salesRows) {
    const amount = Number(row.total_price ?? 0);
    if (!Number.isFinite(amount)) continue;
    if (classifySalePaymentMethod(row.online_payment_method) === 'non_cash') {
      nonCashTurnover += amount;
    } else {
      cashTurnover += amount;
    }
  }

  const salesTaxResult = computeSalesTax(cashTurnover, nonCashTurnover, settings);

  const [paymentsRes, employeesRes] = await Promise.all([
    supabase
      .from('salary_payments')
      .select('amount')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate),
    supabase.from('employees').select('official_salary, is_active').eq('is_active', true),
  ]);

  const payroll = ((paymentsRes.data ?? []) as { amount: number | string | null }[]).reduce(
    (sum, row) => sum + (Number.isFinite(Number(row.amount)) ? Number(row.amount) : 0),
    0,
  );

  let employerContributions = 0;
  let payrollTaxLiability = 0;

  for (const employee of (employeesRes.data ?? []) as EmployeeRow[]) {
    const officialBase = Number(employee.official_salary ?? 0);
    if (!Number.isFinite(officialBase) || officialBase <= 0) continue;
    const taxes = computePayrollTaxes(officialBase, settings);
    employerContributions += prorateEmployerContributions(
      taxes.totalEmployerCost,
      startDate,
      endDate,
    );
    payrollTaxLiability += prorateEmployerContributions(
      taxes.totalPayrollTaxLiability,
      startDate,
      endDate,
    );
  }

  return {
    salesTax: salesTaxResult.totalTax,
    payroll,
    employerContributions,
    payrollTaxLiability,
    cashTurnover,
    nonCashTurnover,
  };
}
