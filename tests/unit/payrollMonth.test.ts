import { describe, it, expect } from 'vitest';
import {
  computeMonthPayable,
  dailyRate,
  daysInMonth,
  nextDayMarkAfterTap,
  resolveDayStatus,
  employeeVisibleInMonth,
  roundMoney3,
} from '../../src/services/finance/payrollMonth';

describe('payrollMonth', () => {
  it('uses calendar days in month for daily rate (option C)', () => {
    expect(daysInMonth(2026, 6)).toBe(31); // July
    expect(daysInMonth(2026, 1)).toBe(28); // Feb 2026
    expect(dailyRate(1200, 31)).toBeCloseTo(1200 / 31, 8);
  });

  it('Mashallah 1200: Sunday offs included; one Monday absent deducts one day', () => {
    // August 2026 has 31 days; Sundays are weekly off (weekday 0)
    const result = computeMonthPayable({
      monthlySalary: 1200,
      year: 2026,
      monthIndex0: 7,
      weeklyOffWeekday: 0,
      marks: [{ work_date: '2026-08-03', mark_type: 'absent' }], // Monday
    });

    expect(result.calendarDays).toBe(31);
    expect(result.absentDays).toBe(1);
    expect(result.weeklyOffDays).toBeGreaterThan(0);
    expect(result.deduction).toBeCloseTo(1200 / 31, 8);
    expect(result.payable).toBeCloseTo(1200 - 1200 / 31, 8);
  });

  it('weekly off alone does not reduce payable', () => {
    const result = computeMonthPayable({
      monthlySalary: 1200,
      year: 2026,
      monthIndex0: 7,
      weeklyOffWeekday: 0,
      marks: [],
    });
    expect(result.absentDays).toBe(0);
    expect(result.payable).toBe(1200);
  });

  it('work mark overrides default Sunday off', () => {
    expect(resolveDayStatus('2026-08-02', 0, undefined)).toBe('weekly_off'); // Sunday
    expect(resolveDayStatus('2026-08-02', 0, 'work')).toBe('work');
  });

  it('tap cycle stores overrides and clears back to defaults', () => {
    // Monday (work by default): work → absent → weekly_off → work(null)
    expect(nextDayMarkAfterTap({ dateKey: '2026-08-03', weeklyOffWeekday: 0, stored: undefined })).toBe(
      'absent',
    );
    expect(nextDayMarkAfterTap({ dateKey: '2026-08-03', weeklyOffWeekday: 0, stored: 'absent' })).toBe(
      'weekly_off',
    );
    expect(
      nextDayMarkAfterTap({ dateKey: '2026-08-03', weeklyOffWeekday: 0, stored: 'weekly_off' }),
    ).toBeNull();

    // Sunday (off by default): weekly_off → work → absent → weekly_off(null)
    expect(nextDayMarkAfterTap({ dateKey: '2026-08-02', weeklyOffWeekday: 0, stored: undefined })).toBe(
      'work',
    );
    expect(nextDayMarkAfterTap({ dateKey: '2026-08-02', weeklyOffWeekday: 0, stored: 'work' })).toBe(
      'absent',
    );
    expect(nextDayMarkAfterTap({ dateKey: '2026-08-02', weeklyOffWeekday: 0, stored: 'absent' })).toBeNull();
  });

  it('hides employees hired after the selected month', () => {
    expect(employeeVisibleInMonth('2026-09-01', 2026, 7)).toBe(false);
    expect(employeeVisibleInMonth('2026-08-15', 2026, 7)).toBe(true);
    expect(employeeVisibleInMonth(null, 2026, 7)).toBe(true);
  });

  it('roundMoney3 keeps three decimals', () => {
    expect(roundMoney3(1200 - 1200 / 31)).toBe(roundMoney3(1161.290322580645));
  });
});
