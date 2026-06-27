import { describe, expect, it } from 'vitest';
import type { TaxSettings } from '../../src/lib/supabase';
import { computeIncomeTax, computePayrollTaxes } from '../../src/services/finance/payrollTax';
import { computeSalesTax } from '../../src/services/finance/salesTax';

const defaultSettings: TaxSettings = {
  id: '00000000-0000-4000-8000-000000000001',
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

describe('computeIncomeTax', () => {
  it('applies 3% on first bracket after 200 AZN exempt', () => {
    expect(computeIncomeTax(2400, defaultSettings)).toBeCloseTo(66, 2);
  });

  it('applies progressive second bracket', () => {
    expect(computeIncomeTax(7900, defaultSettings)).toBeCloseTo(615, 2);
  });

  it('returns zero for zero base', () => {
    expect(computeIncomeTax(0, defaultSettings)).toBe(0);
  });
});

describe('computePayrollTaxes', () => {
  it('returns employer and employee components for official base', () => {
    const result = computePayrollTaxes(2400, defaultSettings);
    expect(result.incomeTax).toBeCloseTo(66, 2);
    expect(result.totalEmployerCost).toBeGreaterThan(0);
    expect(result.totalEmployeeWithheld).toBeGreaterThan(result.incomeTax);
    expect(result.totalPayrollTaxLiability).toBeCloseTo(
      result.totalEmployeeWithheld + result.totalEmployerCost,
      2,
    );
  });
});

describe('computeSalesTax', () => {
  it('computes separate cash and non-cash simplified tax', () => {
    const result = computeSalesTax(10000, 5000, defaultSettings);
    expect(result.cashTax).toBe(200);
    expect(result.nonCashTax).toBe(100);
    expect(result.totalTax).toBe(300);
  });
});
