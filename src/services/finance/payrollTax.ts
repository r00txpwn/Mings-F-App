import type { TaxSettings } from '../../lib/supabase';

export interface PayrollTaxBreakdown {
  incomeTax: number;
  socialEmployee: number;
  socialEmployer: number;
  medicalEmployee: number;
  medicalEmployer: number;
  unemploymentEmployee: number;
  unemploymentEmployer: number;
  totalEmployeeWithheld: number;
  totalEmployerCost: number;
  totalPayrollTaxLiability: number;
}

const pct = (amount: number, rate: number): number => (amount * rate) / 100;

export function computeIncomeTax(officialBase: number, settings: TaxSettings): number {
  if (officialBase <= 0) return 0;

  const {
    pit_exempt_amount: exempt,
    pit_bracket1_max: b1,
    pit_bracket2_max: b2,
    pit_bracket1_pct: r1,
    pit_bracket2_pct: r2,
    pit_bracket3_pct: r3,
    pit_bracket2_fixed: fixed2,
    pit_bracket3_fixed: fixed3,
  } = settings;

  if (officialBase <= b1) {
    return Math.max(0, pct(officialBase - exempt, r1));
  }
  if (officialBase <= b2) {
    return fixed2 + pct(officialBase - b1, r2);
  }
  return fixed3 + pct(officialBase - b2, r3);
}

function computeSocialInsurance(
  officialBase: number,
  settings: TaxSettings,
): { employee: number; employer: number } {
  if (officialBase <= 0) return { employee: 0, employer: 0 };

  const cap = settings.dsmf_high_income_cap;
  const baseUpToCap = Math.min(officialBase, cap);
  const lowCap = settings.dsmf_employee_low_cap;

  const employeeLow = pct(Math.min(baseUpToCap, lowCap), settings.dsmf_employee_low_pct);
  const employeeMid = pct(Math.max(baseUpToCap - lowCap, 0), settings.dsmf_employee_high_pct);

  const employerLow = pct(Math.min(baseUpToCap, settings.dsmf_employer_low_cap), settings.dsmf_employer_low_pct);
  const employerMid = pct(Math.max(baseUpToCap - settings.dsmf_employer_low_cap, 0), settings.dsmf_employer_high_pct);

  let employee = employeeLow + employeeMid;
  let employer = employerLow + employerMid;

  if (officialBase > cap) {
    const excess = officialBase - cap;
    employee += pct(excess, settings.dsmf_employee_high_income_pct);
    employer += pct(excess, settings.dsmf_employer_high_income_pct);
  }

  return { employee, employer };
}

function computeMedicalInsurance(
  officialBase: number,
  settings: TaxSettings,
): { employee: number; employer: number } {
  if (officialBase <= 0) return { employee: 0, employer: 0 };

  const lowCap = settings.medical_low_cap;
  const lowBase = Math.min(officialBase, lowCap);
  const highBase = Math.max(officialBase - lowCap, 0);

  const employee =
    pct(lowBase, settings.medical_employee_low_pct) +
    pct(highBase, settings.medical_employee_high_pct);
  const employer =
    pct(lowBase, settings.medical_employer_low_pct) +
    pct(highBase, settings.medical_employer_high_pct);

  return { employee, employer };
}

function computeUnemployment(
  officialBase: number,
  settings: TaxSettings,
): { employee: number; employer: number } {
  if (officialBase <= 0) return { employee: 0, employer: 0 };
  return {
    employee: pct(officialBase, settings.unemployment_employee_pct),
    employer: pct(officialBase, settings.unemployment_employer_pct),
  };
}

/** Compute monthly payroll taxes on the officially declared salary base (AZ private sector 2026 defaults). */
export function computePayrollTaxes(officialBase: number, settings: TaxSettings): PayrollTaxBreakdown {
  const base = Math.max(0, officialBase);
  const incomeTax = computeIncomeTax(base, settings);
  const social = computeSocialInsurance(base, settings);
  const medical = computeMedicalInsurance(base, settings);
  const unemployment = computeUnemployment(base, settings);

  const totalEmployeeWithheld =
    incomeTax + social.employee + medical.employee + unemployment.employee;
  const totalEmployerCost = social.employer + medical.employer + unemployment.employer;

  return {
    incomeTax,
    socialEmployee: social.employee,
    socialEmployer: social.employer,
    medicalEmployee: medical.employee,
    medicalEmployer: medical.employer,
    unemploymentEmployee: unemployment.employee,
    unemploymentEmployer: unemployment.employer,
    totalEmployeeWithheld,
    totalEmployerCost,
    totalPayrollTaxLiability: totalEmployeeWithheld + totalEmployerCost,
  };
}

/** Prorate monthly employer contributions across a date range within one calendar month. */
export function prorateEmployerContributions(
  monthlyEmployerCost: number,
  periodStart: string,
  periodEnd: string,
): number {
  if (monthlyEmployerCost <= 0) return 0;

  const start = new Date(`${periodStart}T00:00:00`);
  const end = new Date(`${periodEnd}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

  let total = 0;
  let cursor = new Date(start);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const overlapStart = cursor > monthStart ? cursor : monthStart;
    const overlapEnd = end < monthEnd ? end : monthEnd;
    const overlapDays =
      Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1;
    const daysInMonth = monthEnd.getDate();
    total += monthlyEmployerCost * (overlapDays / daysInMonth);
    cursor = new Date(year, month + 1, 1);
  }

  return total;
}
