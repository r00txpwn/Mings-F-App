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
    const result = computeMonthPayable({
      monthlySalary: 1200,
      year: 2026,
      monthIndex0: 7,
      weeklyOffWeekday: 0,
      marks: [{ work_date: '2026-08-03', mark_type: 'absent' }],
    });

    expect(result.calendarDays).toBe(31);
    expect(result.employmentDays).toBe(31);
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

  it('leaves mid-month: payable covers days through left_at inclusive', () => {
    const result = computeMonthPayable({
      monthlySalary: 1200,
      year: 2026,
      monthIndex0: 7,
      weeklyOffWeekday: 0,
      marks: [],
      leftAt: '2026-08-15',
    });
    expect(result.employmentDays).toBe(15);
    expect(result.payable).toBeCloseTo(15 * (1200 / 31), 8);
  });

  it('leave + absence only counts absences during employment', () => {
    const result = computeMonthPayable({
      monthlySalary: 1200,
      year: 2026,
      monthIndex0: 7,
      weeklyOffWeekday: 0,
      leftAt: '2026-08-15',
      marks: [
        { work_date: '2026-08-03', mark_type: 'absent' }, // before leave
        { work_date: '2026-08-20', mark_type: 'absent' }, // after leave — ignored
      ],
    });
    expect(result.employmentDays).toBe(15);
    expect(result.absentDays).toBe(1);
    expect(result.payable).toBeCloseTo(14 * (1200 / 31), 8);
  });

  it('work mark overrides default Sunday off', () => {
    expect(resolveDayStatus('2026-08-02', 0, undefined)).toBe('weekly_off');
    expect(resolveDayStatus('2026-08-02', 0, 'work')).toBe('work');
  });

  it('tap cycle stores overrides and clears back to defaults', () => {
    expect(nextDayMarkAfterTap({ dateKey: '2026-08-03', weeklyOffWeekday: 0, stored: undefined })).toBe(
      'absent',
    );
    expect(nextDayMarkAfterTap({ dateKey: '2026-08-03', weeklyOffWeekday: 0, stored: 'absent' })).toBe(
      'weekly_off',
    );
    expect(
      nextDayMarkAfterTap({ dateKey: '2026-08-03', weeklyOffWeekday: 0, stored: 'weekly_off' }),
    ).toBeNull();

    expect(nextDayMarkAfterTap({ dateKey: '2026-08-02', weeklyOffWeekday: 0, stored: undefined })).toBe(
      'work',
    );
    expect(nextDayMarkAfterTap({ dateKey: '2026-08-02', weeklyOffWeekday: 0, stored: 'work' })).toBe(
      'absent',
    );
    expect(nextDayMarkAfterTap({ dateKey: '2026-08-02', weeklyOffWeekday: 0, stored: 'absent' })).toBeNull();
  });

  it('hides employees outside the selected month employment window', () => {
    expect(employeeVisibleInMonth('2026-09-01', 2026, 7)).toBe(false);
    expect(employeeVisibleInMonth('2026-08-15', 2026, 7)).toBe(true);
    expect(employeeVisibleInMonth(null, 2026, 7)).toBe(true);
    expect(employeeVisibleInMonth(null, 2026, 7, '2026-07-31')).toBe(false);
    expect(employeeVisibleInMonth('2026-08-01', 2026, 7, '2026-08-15')).toBe(true);
  });

  it('roundMoney3 keeps three decimals', () => {
    expect(roundMoney3(1200 - 1200 / 31)).toBe(roundMoney3(1161.290322580645));
  });
});
