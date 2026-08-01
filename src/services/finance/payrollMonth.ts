/** Month payroll math: salary covers weekly offs; absences deduct calendar-day rate. */

export type EmployeeDayMarkType = 'weekly_off' | 'absent' | 'work';
export type ResolvedDayStatus = 'work' | 'weekly_off' | 'absent';

export type DayMarkInput = {
  work_date: string;
  mark_type: EmployeeDayMarkType;
};

const CYCLE: ResolvedDayStatus[] = ['work', 'absent', 'weekly_off'];

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** monthIndex0: 0 = January … 11 = December */
export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

export function monthDateRange(year: number, monthIndex0: number): { start: string; end: string } {
  const last = daysInMonth(year, monthIndex0);
  const ym = `${year}-${pad2(monthIndex0 + 1)}`;
  return { start: `${ym}-01`, end: `${ym}-${pad2(last)}` };
}

export function shiftMonth(
  year: number,
  monthIndex0: number,
  delta: number,
): { year: number; monthIndex0: number } {
  const d = new Date(year, monthIndex0 + delta, 1);
  return { year: d.getFullYear(), monthIndex0: d.getMonth() };
}

export function dailyRate(monthlySalary: number, calendarDays: number): number {
  if (!Number.isFinite(monthlySalary) || monthlySalary < 0 || calendarDays <= 0) return 0;
  return monthlySalary / calendarDays;
}

/** Parse YYYY-MM-DD as local calendar date (no UTC shift). */
export function parseLocalDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function dateKeyOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : null;
}

/** Inclusive employment day within the month (hired_at / left_at bounds). */
export function isEmploymentDay(
  dateKey: string,
  hiredAt: string | null | undefined,
  leftAt: string | null | undefined,
): boolean {
  const hired = dateKeyOnly(hiredAt);
  const left = dateKeyOnly(leftAt);
  if (hired && dateKey < hired) return false;
  if (left && dateKey > left) return false;
  return true;
}

export function resolveDayStatus(
  dateKey: string,
  weeklyOffWeekday: number,
  stored: EmployeeDayMarkType | undefined,
): ResolvedDayStatus {
  if (stored === 'absent') return 'absent';
  if (stored === 'weekly_off') return 'weekly_off';
  if (stored === 'work') return 'work';
  const weekday = parseLocalDateKey(dateKey).getDay();
  if (weekday === weeklyOffWeekday) return 'weekly_off';
  return 'work';
}

export function buildMonthDays(year: number, monthIndex0: number): string[] {
  const count = daysInMonth(year, monthIndex0);
  const ym = `${year}-${pad2(monthIndex0 + 1)}`;
  return Array.from({ length: count }, (_, i) => `${ym}-${pad2(i + 1)}`);
}

export function marksByDate(marks: DayMarkInput[]): Map<string, EmployeeDayMarkType> {
  const map = new Map<string, EmployeeDayMarkType>();
  for (const mark of marks) {
    map.set(mark.work_date, mark.mark_type);
  }
  return map;
}

export type MonthPayableResult = {
  calendarDays: number;
  dailyRate: number;
  employmentDays: number;
  absentDays: number;
  weeklyOffDays: number;
  workDays: number;
  deduction: number;
  payable: number;
};

export function computeMonthPayable(input: {
  monthlySalary: number;
  year: number;
  monthIndex0: number;
  weeklyOffWeekday: number;
  marks: DayMarkInput[];
  hiredAt?: string | null;
  leftAt?: string | null;
}): MonthPayableResult {
  const calendarDays = daysInMonth(input.year, input.monthIndex0);
  const rate = dailyRate(input.monthlySalary, calendarDays);
  const byDate = marksByDate(input.marks);
  let employmentDays = 0;
  let absentDays = 0;
  let weeklyOffDays = 0;
  let workDays = 0;

  for (const dateKey of buildMonthDays(input.year, input.monthIndex0)) {
    if (!isEmploymentDay(dateKey, input.hiredAt, input.leftAt)) continue;
    employmentDays += 1;
    const status = resolveDayStatus(dateKey, input.weeklyOffWeekday, byDate.get(dateKey));
    if (status === 'absent') absentDays += 1;
    else if (status === 'weekly_off') weeklyOffDays += 1;
    else workDays += 1;
  }

  const paidDays = Math.max(0, employmentDays - absentDays);
  const payable = paidDays * rate;
  const fullSalary = Number.isFinite(input.monthlySalary) ? input.monthlySalary : 0;
  const deduction = Math.max(0, fullSalary - payable);

  return {
    calendarDays,
    dailyRate: rate,
    employmentDays,
    absentDays,
    weeklyOffDays,
    workDays,
    deduction,
    payable,
  };
}

/**
 * Next stored mark after a tap.
 * Returns null when the next state matches the default suggestion (no row needed).
 */
export function nextDayMarkAfterTap(input: {
  dateKey: string;
  weeklyOffWeekday: number;
  stored: EmployeeDayMarkType | undefined;
}): EmployeeDayMarkType | null {
  const current = resolveDayStatus(input.dateKey, input.weeklyOffWeekday, input.stored);
  const idx = CYCLE.indexOf(current);
  const next = CYCLE[(idx + 1) % CYCLE.length]!;
  const defaultOff = parseLocalDateKey(input.dateKey).getDay() === input.weeklyOffWeekday;

  if (next === 'work' && !defaultOff) return null;
  if (next === 'weekly_off' && defaultOff) return null;
  return next;
}

export function employeeVisibleInMonth(
  hiredAt: string | null | undefined,
  year: number,
  monthIndex0: number,
  leftAt?: string | null,
): boolean {
  const { start, end } = monthDateRange(year, monthIndex0);
  const hired = dateKeyOnly(hiredAt);
  const left = dateKeyOnly(leftAt);
  if (hired && hired > end) return false;
  if (left && left < start) return false;
  return true;
}

export function roundMoney3(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1000) / 1000;
}
