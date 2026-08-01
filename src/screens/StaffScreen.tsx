import { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import {
  Plus,
  Users,
  Loader2,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Banknote,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
} from 'lucide-react';
import {
  supabase,
  type Employee,
  type EmployeeDayMark,
  type EmployeeDayMarkType,
  type SalaryPayment,
  type SalaryPaymentType,
  type WeekdayIndex,
} from '../lib/supabase';
import { adminDelete, adminInsert, adminUpdate } from '../lib/adminApi';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/cockpit';
import { SingleDatePicker } from '../components/SingleDatePicker';
import { IconActionButton } from '../components/ui/IconActionButton';
import { DangerConfirmRow } from '../components/ui/DangerConfirmRow';
import { EmptyState } from '../components/ui/EmptyState';
import { ReviewBadge } from '../components/ui/ReviewBadge';
import { SkeletonCard } from '../components/ui/Skeleton';
import { displayName, isTestRecord } from '../lib/displayName';
import { formatFinanceMoney } from '../lib/money';
import {
  buildMonthDays,
  computeMonthPayable,
  employeeVisibleInMonth,
  monthDateRange,
  nextDayMarkAfterTap,
  parseLocalDateKey,
  resolveDayStatus,
  roundMoney3,
  shiftMonth,
  toLocalDateKey,
  type ResolvedDayStatus,
} from '../services/finance/payrollMonth';

type PaymentWithEmployee = SalaryPayment & {
  employees?: { full_name: string; designation: string } | null;
};

const toLocalDateInput = (date: Date) => toLocalDateKey(date);

const PAYMENT_TYPES: SalaryPaymentType[] = ['salary', 'advance', 'bonus', 'partial'];
const UNUSUAL_AMOUNT_THRESHOLD = 10000;
const WEEKDAY_KEYS = [
  'staffWeekdaySun',
  'staffWeekdayMon',
  'staffWeekdayTue',
  'staffWeekdayWed',
  'staffWeekdayThu',
  'staffWeekdayFri',
  'staffWeekdaySat',
] as const;

function normalizeWeekday(value: unknown): WeekdayIndex {
  const n = Number(value);
  if (Number.isInteger(n) && n >= 0 && n <= 6) return n as WeekdayIndex;
  return 0;
}

function dayCellClasses(status: ResolvedDayStatus): string {
  if (status === 'absent') {
    return 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100';
  }
  if (status === 'weekly_off') {
    return 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300';
  }
  return 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';
}

export function StaffScreen() {
  const { t, language } = useLanguage();
  const toast = useToast();
  const { user } = useAuth();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex0, setMonthIndex0] = useState(now.getMonth());

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payments, setPayments] = useState<PaymentWithEmployee[]>([]);
  const [dayMarks, setDayMarks] = useState<EmployeeDayMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [markSavingKey, setMarkSavingKey] = useState<string | null>(null);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentWithEmployee | null>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [paymentEmployeeId, setPaymentEmployeeId] = useState('');

  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [totalSalary, setTotalSalary] = useState('');
  const [hiredAt, setHiredAt] = useState('');
  const [weeklyOffWeekday, setWeeklyOffWeekday] = useState<WeekdayIndex>(0);
  const [isActive, setIsActive] = useState(true);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(toLocalDateInput(new Date()));
  const [paymentType, setPaymentType] = useState<SalaryPaymentType>('salary');
  const [paymentNote, setPaymentNote] = useState('');

  const monthRange = useMemo(() => monthDateRange(year, monthIndex0), [year, monthIndex0]);
  const monthDays = useMemo(() => buildMonthDays(year, monthIndex0), [year, monthIndex0]);

  const monthLabel = useMemo(() => {
    const locale = language === 'az' ? 'az-AZ' : language === 'ru' ? 'ru-RU' : 'en-GB';
    return new Date(year, monthIndex0, 1).toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
    });
  }, [language, monthIndex0, year]);

  const weekdayLabel = useCallback(
    (day: WeekdayIndex) => t[WEEKDAY_KEYS[day]],
    [t],
  );

  const paymentTypeLabel = (type: SalaryPaymentType) => {
    if (type === 'salary') return t.staffPaymentTypeSalary;
    if (type === 'advance') return t.staffPaymentTypeAdvance;
    if (type === 'bonus') return t.staffPaymentTypeBonus;
    return t.staffPaymentTypePartial;
  };

  const statusLabel = (status: ResolvedDayStatus) => {
    if (status === 'absent') return t.staffDayAbsent;
    if (status === 'weekly_off') return t.staffDayWeeklyOff;
    return t.staffDayWork;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [empRes, payRes, markRes] = await Promise.all([
      supabase.from('employees').select('*').order('full_name'),
      supabase
        .from('salary_payments')
        .select('*, employees(full_name, designation)')
        .gte('payment_date', monthRange.start)
        .lte('payment_date', monthRange.end)
        .order('payment_date', { ascending: false }),
      supabase
        .from('employee_day_marks')
        .select('*')
        .gte('work_date', monthRange.start)
        .lte('work_date', monthRange.end),
    ]);

    if (empRes.data) setEmployees(empRes.data as Employee[]);
    if (payRes.data) setPayments(payRes.data as PaymentWithEmployee[]);
    if (markRes.error) {
      // Table may not exist until migration is applied — keep UI usable.
      setDayMarks([]);
    } else if (markRes.data) {
      setDayMarks(markRes.data as EmployeeDayMark[]);
    }
    setLoading(false);
  }, [monthRange.end, monthRange.start]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetEmployeeForm = () => {
    setFullName('');
    setDesignation('');
    setTotalSalary('');
    setHiredAt('');
    setWeeklyOffWeekday(0);
    setIsActive(true);
    setEditingEmployee(null);
    setShowEmployeeForm(false);
  };

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentDate(toLocalDateInput(new Date()));
    setPaymentType('salary');
    setPaymentNote('');
    setPaymentEmployeeId('');
    setEditingPayment(null);
    setShowPaymentForm(false);
  };

  const openEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setFullName(employee.full_name);
    setDesignation(employee.designation);
    setTotalSalary(String(employee.total_salary));
    setHiredAt(employee.hired_at ?? '');
    setWeeklyOffWeekday(normalizeWeekday(employee.weekly_off_weekday));
    setIsActive(employee.is_active);
    setShowEmployeeForm(true);
  };

  const marksByEmployee = useMemo(() => {
    const map = new Map<string, EmployeeDayMark[]>();
    for (const mark of dayMarks) {
      const list = map.get(mark.employee_id) ?? [];
      list.push(mark);
      map.set(mark.employee_id, list);
    }
    return map;
  }, [dayMarks]);

  const paymentsByEmployee = useMemo(() => {
    const map = new Map<string, PaymentWithEmployee[]>();
    for (const payment of payments) {
      const list = map.get(payment.employee_id) ?? [];
      list.push(payment);
      map.set(payment.employee_id, list);
    }
    return map;
  }, [payments]);

  const visibleEmployees = useMemo(
    () =>
      employees.filter(
        (e) => !isTestRecord(e.full_name) && employeeVisibleInMonth(e.hired_at, year, monthIndex0),
      ),
    [employees, monthIndex0, year],
  );

  const employeeMonthStats = useCallback(
    (employee: Employee) => {
      const weeklyOff = normalizeWeekday(employee.weekly_off_weekday);
      const marks = (marksByEmployee.get(employee.id) ?? []).map((m) => ({
        work_date: m.work_date,
        mark_type: m.mark_type,
      }));
      const payableInfo = computeMonthPayable({
        monthlySalary: Number(employee.total_salary),
        year,
        monthIndex0,
        weeklyOffWeekday: weeklyOff,
        marks,
      });
      const employeePayments = paymentsByEmployee.get(employee.id) ?? [];
      const paid = employeePayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Math.max(0, payableInfo.payable - paid);
      let payStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
      if (paid <= 0) payStatus = 'unpaid';
      else if (paid + 0.0005 >= payableInfo.payable) payStatus = 'paid';
      else payStatus = 'partial';
      return { payableInfo, paid, remaining, payStatus, weeklyOff };
    },
    [marksByEmployee, monthIndex0, paymentsByEmployee, year],
  );

  const openAddPayment = (employeeId?: string) => {
    resetPaymentForm();
    if (employeeId) {
      setPaymentEmployeeId(employeeId);
      const employee = employees.find((e) => e.id === employeeId);
      if (employee) {
        const { remaining } = employeeMonthStats(employee);
        if (remaining > 0) setPaymentAmount(String(roundMoney3(remaining)));
      }
    }
    const midMonth = new Date(year, monthIndex0, Math.min(now.getDate(), monthDays.length));
    setPaymentDate(toLocalDateKey(midMonth));
    setShowPaymentForm(true);
  };

  const openEditPayment = (payment: PaymentWithEmployee) => {
    setEditingPayment(payment);
    setPaymentEmployeeId(payment.employee_id);
    setPaymentAmount(String(payment.amount));
    setPaymentDate(payment.payment_date);
    setPaymentType(payment.payment_type);
    setPaymentNote(payment.note);
    setShowPaymentForm(true);
  };

  const handleSaveEmployee = async () => {
    const total = Number(totalSalary);
    if (!fullName.trim()) {
      toast.error(t.staffNameRequired);
      return;
    }
    if (!Number.isFinite(total) || total < 0) {
      toast.error(t.staffInvalidSalary);
      return;
    }

    setSaving(true);
    const payload = {
      full_name: fullName.trim(),
      designation: designation.trim(),
      total_salary: total,
      official_salary: total,
      is_active: isActive,
      hired_at: hiredAt.trim() || null,
      weekly_off_weekday: weeklyOffWeekday,
      updated_at: new Date().toISOString(),
    };

    const result = editingEmployee
      ? await adminUpdate('employees', editingEmployee.id, payload)
      : await adminInsert('employees', { ...payload, created_by: user?.id ?? null });

    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(editingEmployee ? t.staffEmployeeUpdated : t.staffEmployeeAdded);
    resetEmployeeForm();
    void loadData();
  };

  const handleDeleteEmployee = async (id: string) => {
    setSaving(true);
    const result = await adminDelete('employees', id);
    setSaving(false);
    setDeleteEmployeeId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t.staffEmployeeDeleted);
    void loadData();
  };

  const handleSavePayment = async () => {
    const amount = Number(paymentAmount);
    if (!paymentEmployeeId) {
      toast.error(t.staffSelectEmployee);
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t.staffInvalidPaymentAmount);
      return;
    }

    setSaving(true);
    const payload = {
      employee_id: paymentEmployeeId,
      amount,
      payment_date: paymentDate,
      payment_type: paymentType,
      note: paymentNote.trim(),
    };

    const result = editingPayment
      ? await adminUpdate('salary_payments', editingPayment.id, payload)
      : await adminInsert('salary_payments', { ...payload, created_by: user?.id ?? null });

    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(editingPayment ? t.staffPaymentUpdated : t.staffPaymentAdded);
    resetPaymentForm();
    void loadData();
  };

  const handleDeletePayment = async (id: string) => {
    setSaving(true);
    const result = await adminDelete('salary_payments', id);
    setSaving(false);
    setDeletePaymentId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t.staffPaymentDeleted);
    void loadData();
  };

  const handleCycleDayMark = async (employee: Employee, dateKey: string) => {
    const key = `${employee.id}:${dateKey}`;
    if (markSavingKey) return;
    const weeklyOff = normalizeWeekday(employee.weekly_off_weekday);
    const existing = (marksByEmployee.get(employee.id) ?? []).find((m) => m.work_date === dateKey);
    const next = nextDayMarkAfterTap({
      dateKey,
      weeklyOffWeekday: weeklyOff,
      stored: existing?.mark_type,
    });

    setMarkSavingKey(key);
    let result;
    if (next === null) {
      if (existing) result = await adminDelete('employee_day_marks', existing.id);
      else result = { ok: true as const };
    } else if (existing) {
      result = await adminUpdate('employee_day_marks', existing.id, {
        mark_type: next,
        updated_at: new Date().toISOString(),
      });
    } else {
      result = await adminInsert('employee_day_marks', {
        employee_id: employee.id,
        work_date: dateKey,
        mark_type: next as EmployeeDayMarkType,
        created_by: user?.id ?? null,
      });
    }
    setMarkSavingKey(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    void loadData();
  };

  const summary = useMemo(() => {
    let monthPayable = 0;
    let activeCount = 0;
    for (const employee of visibleEmployees) {
      if (!employee.is_active) continue;
      activeCount += 1;
      monthPayable += employeeMonthStats(employee).payableInfo.payable;
    }
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Math.max(0, monthPayable - totalPaid);
    return { totalPaid, activeCount, monthPayable, remaining };
  }, [employeeMonthStats, payments, visibleEmployees]);

  const suggestedForPaymentForm = useMemo(() => {
    if (!paymentEmployeeId || editingPayment) return null;
    const employee = employees.find((e) => e.id === paymentEmployeeId);
    if (!employee) return null;
    return roundMoney3(employeeMonthStats(employee).remaining);
  }, [editingPayment, employeeMonthStats, employees, paymentEmployeeId]);

  const goMonth = (delta: number) => {
    const next = shiftMonth(year, monthIndex0, delta);
    setYear(next.year);
    setMonthIndex0(next.monthIndex0);
  };

  const firstWeekday = parseLocalDateKey(monthDays[0] ?? monthRange.start).getDay();

  return (
    <div className="animate-fadeIn">
      <PageHeader
        eyebrow={t.staff}
        title={t.staffScreenTitle}
        description={t.staffScreenDescription}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="cockpit-btn-secondary cursor-pointer" onClick={() => openAddPayment()}>
              <Banknote className="h-4 w-4" />
              {t.staffRecordPayment}
            </button>
            <button
              type="button"
              className="cockpit-btn-primary cursor-pointer"
              onClick={() => {
                resetEmployeeForm();
                setShowEmployeeForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t.staffAddEmployee}
            </button>
          </div>
        }
      />

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        {t.staffDoubleEntryWarning}
      </div>

      <div className="mb-4 flex items-center justify-center gap-2">
        <button
          type="button"
          className="cockpit-btn-secondary min-h-[44px] min-w-[44px] cursor-pointer px-3"
          onClick={() => goMonth(-1)}
          aria-label={t.staffPrevMonth}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="min-w-[10rem] text-center text-base font-semibold capitalize text-slate-800 dark:text-slate-100">
          {monthLabel}
        </p>
        <button
          type="button"
          className="cockpit-btn-secondary min-h-[44px] min-w-[44px] cursor-pointer px-3"
          onClick={() => goMonth(1)}
          aria-label={t.staffNextMonth}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cockpit-card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t.staffActiveEmployees}</p>
          <p className="text-2xl font-semibold tabular-nums">{summary.activeCount}</p>
        </div>
        <div className="cockpit-card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t.staffMonthlyPayrollTarget}</p>
          <p className="text-2xl font-semibold tabular-nums">₼{formatFinanceMoney(summary.monthPayable)}</p>
        </div>
        <div className="cockpit-card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t.staffPaidInPeriod}</p>
          <p className="text-2xl font-semibold tabular-nums">₼{formatFinanceMoney(summary.totalPaid)}</p>
        </div>
        <div className="cockpit-card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t.staffRemaining}</p>
          <p className="text-2xl font-semibold tabular-nums">₼{formatFinanceMoney(summary.remaining)}</p>
        </div>
      </div>

      {showEmployeeForm && (
        <div className="cockpit-card mb-6 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">
              {editingEmployee ? t.staffEditEmployee : t.staffAddEmployee}
            </h3>
            <button type="button" onClick={resetEmployeeForm} className="cursor-pointer text-slate-500 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.staffFullName}</span>
              <input className="cockpit-input mt-1 w-full" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.staffDesignation}</span>
              <input className="cockpit-input mt-1 w-full" value={designation} onChange={(e) => setDesignation(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.staffTotalSalary}</span>
              <input
                className="cockpit-input mt-1 w-full"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.001"
                value={totalSalary}
                onChange={(e) => setTotalSalary(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.staffStartDate}</span>
              <div className="mt-1">
                <SingleDatePicker value={hiredAt} onChange={setHiredAt} />
              </div>
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.staffWeeklyOffDay}</span>
              <select
                className="cockpit-input mt-1 w-full"
                value={weeklyOffWeekday}
                onChange={(e) => setWeeklyOffWeekday(normalizeWeekday(e.target.value))}
              >
                {WEEKDAY_KEYS.map((key, idx) => (
                  <option key={key} value={idx}>
                    {t[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm">{t.staffActiveLabel}</span>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" className="cockpit-btn-primary cursor-pointer" disabled={saving} onClick={() => void handleSaveEmployee()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t.save}
            </button>
            <button type="button" className="cockpit-btn-secondary cursor-pointer" onClick={resetEmployeeForm}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {showPaymentForm && (
        <div className="cockpit-card mb-6 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">
              {editingPayment ? t.staffEditPayment : t.staffRecordPayment}
            </h3>
            <button type="button" onClick={resetPaymentForm} className="cursor-pointer text-slate-500 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.staffEmployee}</span>
              <select
                className="cockpit-input mt-1 w-full"
                value={paymentEmployeeId}
                onChange={(e) => {
                  const id = e.target.value;
                  setPaymentEmployeeId(id);
                  const employee = employees.find((row) => row.id === id);
                  if (employee && !editingPayment) {
                    const { remaining } = employeeMonthStats(employee);
                    setPaymentAmount(remaining > 0 ? String(roundMoney3(remaining)) : '');
                  }
                }}
              >
                <option value="">{t.staffSelectEmployee}</option>
                {visibleEmployees.filter((e) => e.is_active).map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} — {employee.designation}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.amount}</span>
              <input
                className="cockpit-input mt-1 w-full"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.001"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              {suggestedForPaymentForm != null && suggestedForPaymentForm > 0 ? (
                <p className="mt-1 text-xs text-slate-500">
                  {t.staffSuggestedPayment.replace('{amount}', formatFinanceMoney(suggestedForPaymentForm))}
                </p>
              ) : null}
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.date}</span>
              <SingleDatePicker value={paymentDate} onChange={setPaymentDate} />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.staffPaymentType}</span>
              <select className="cockpit-input mt-1 w-full" value={paymentType} onChange={(e) => setPaymentType(e.target.value as SalaryPaymentType)}>
                {PAYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {paymentTypeLabel(type)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.notes}</span>
              <input className="cockpit-input mt-1 w-full" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" className="cockpit-btn-primary cursor-pointer" disabled={saving} onClick={() => void handleSavePayment()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t.save}
            </button>
            <button type="button" className="cockpit-btn-secondary cursor-pointer" onClick={resetPaymentForm}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : visibleEmployees.length === 0 ? (
        <EmptyState icon={Users} title={t.staffNoEmployees} />
      ) : (
        <div className="space-y-3">
          {visibleEmployees.map((employee) => {
            const { payableInfo, paid, remaining, payStatus } = employeeMonthStats(employee);
            const employeePayments = paymentsByEmployee.get(employee.id) ?? [];
            const expanded = expandedEmployeeId === employee.id;
            const unusualSalary = Number(employee.total_salary) >= UNUSUAL_AMOUNT_THRESHOLD;
            const weeklyOff = normalizeWeekday(employee.weekly_off_weekday);
            const markMap = new Map(
              (marksByEmployee.get(employee.id) ?? []).map((m) => [m.work_date, m.mark_type]),
            );

            const StatusIcon =
              payStatus === 'paid' ? CheckCircle2 : payStatus === 'partial' ? CircleDashed : AlertCircle;
            const statusText =
              payStatus === 'paid'
                ? t.staffPayStatusPaid
                : payStatus === 'partial'
                  ? t.staffPayStatusPartial
                  : t.staffPayStatusUnpaid;
            const statusChipClass =
              payStatus === 'paid'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                : payStatus === 'partial'
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200';

            return (
              <div key={employee.id} className="cockpit-card overflow-hidden">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-start gap-2 text-left transition-colors duration-200"
                      onClick={() => setExpandedEmployeeId(expanded ? null : employee.id)}
                    >
                      <span className="mt-0.5 text-slate-500">
                        {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold text-slate-900 dark:text-slate-50">
                            {displayName(employee.full_name, t.cockpitTestRecordLabel)}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusChipClass}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusText}
                          </span>
                          {unusualSalary ? (
                            <ReviewBadge label={t.cockpitNeedsReview} reason={t.cockpitReviewUnusualAmount} />
                          ) : null}
                          {!employee.is_active && (
                            <span className="rounded bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">
                              {t.staffInactive}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-slate-500">
                          {employee.designation || t.staffNoDesignation}
                          {' · '}
                          {weekdayLabel(weeklyOff)}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {t.staffPaidInPeriod}: ₼{formatFinanceMoney(paid)}
                          {' · '}
                          {t.staffAbsentCount}: {payableInfo.absentDays}
                          {' · '}
                          {t.staffOffCount}: {payableInfo.weeklyOffDays}
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{t.staffMonthPayable}</p>
                      <p className="text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                        ₼{formatFinanceMoney(payableInfo.payable)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.staffRemaining}: ₼{formatFinanceMoney(remaining)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconActionButton
                        icon={<Banknote className="h-4 w-4" />}
                        label={t.staffRecordPayment}
                        onClick={() => openAddPayment(employee.id)}
                      />
                      <IconActionButton
                        icon={<Edit2 className="h-4 w-4" />}
                        tone="edit"
                        label={t.edit}
                        onClick={() => openEditEmployee(employee)}
                      />
                      <IconActionButton
                        icon={<Trash2 className="h-4 w-4" />}
                        tone="danger"
                        label={t.delete}
                        onClick={() => setDeleteEmployeeId(employee.id)}
                      />
                    </div>
                  </div>
                </div>

                {deleteEmployeeId === employee.id && (
                  <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                    <DangerConfirmRow
                      message={t.staffDeleteEmployeeConfirm}
                      onConfirm={() => void handleDeleteEmployee(employee.id)}
                      onCancel={() => setDeleteEmployeeId(null)}
                      confirmDisabled={saving}
                    />
                  </div>
                )}

                {expanded && (
                  <div className="space-y-4 border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
                    <div>
                      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold">{t.staffAttendanceTitle}</h4>
                          <p className="text-xs text-slate-500">{t.staffMarkDayHint}</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {t.staffDailyRate}: ₼{formatFinanceMoney(payableInfo.dailyRate)}
                        </p>
                      </div>

                      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-slate-500 sm:text-xs">
                        {WEEKDAY_KEYS.map((key) => (
                          <div key={key}>{t[key].slice(0, 2)}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {Array.from({ length: firstWeekday }).map((_, i) => (
                          <div key={`pad-${i}`} className="min-h-[44px]" />
                        ))}
                        {monthDays.map((dateKey) => {
                          const status = resolveDayStatus(dateKey, weeklyOff, markMap.get(dateKey));
                          const dayNum = Number(dateKey.slice(-2));
                          const busy = markSavingKey === `${employee.id}:${dateKey}`;
                          return (
                            <button
                              key={dateKey}
                              type="button"
                              disabled={busy}
                              onClick={() => void handleCycleDayMark(employee, dateKey)}
                              className={`flex min-h-[44px] min-w-0 cursor-pointer flex-col items-center justify-center rounded-lg border px-0.5 py-1 text-center transition-colors duration-200 touch-manipulation disabled:opacity-60 ${dayCellClasses(status)}`}
                              aria-label={`${dateKey}: ${statusLabel(status)}`}
                              title={statusLabel(status)}
                            >
                              <span className="text-sm font-semibold tabular-nums">{dayNum}</span>
                              <span className="max-w-full truncate text-[10px] leading-tight">
                                {status === 'work' ? '' : statusLabel(status)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{t.staffDayLegend}</p>
                      {payableInfo.absentDays > 0 ? (
                        <p className="mt-1 text-xs font-medium text-rose-700 dark:text-rose-300">
                          {t.staffAbsenceDeductionHint
                            .replace('{count}', String(payableInfo.absentDays))
                            .replace('{rate}', formatFinanceMoney(payableInfo.dailyRate))
                            .replace('{deduction}', formatFinanceMoney(payableInfo.deduction))}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold">{t.staffPaidInPeriod}</h4>
                      {employeePayments.length === 0 ? (
                        <p className="text-sm text-slate-500">{t.staffNoPaymentsInPeriod}</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[480px] text-sm">
                            <thead>
                              <tr className="border-b text-left text-xs uppercase text-slate-500">
                                <th className="px-2 py-2">{t.date}</th>
                                <th className="px-2 py-2">{t.staffPaymentType}</th>
                                <th className="px-2 py-2">{t.amount}</th>
                                <th className="px-2 py-2">{t.notes}</th>
                                <th className="px-2 py-2" />
                              </tr>
                            </thead>
                            <tbody>
                              {employeePayments.map((payment) => {
                                const unusualPayment = Number(payment.amount) >= UNUSUAL_AMOUNT_THRESHOLD;
                                return (
                                  <Fragment key={payment.id}>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                      <td className="px-2 py-2">{payment.payment_date}</td>
                                      <td className="px-2 py-2">{paymentTypeLabel(payment.payment_type)}</td>
                                      <td className="px-2 py-2 font-medium tabular-nums">
                                        <span className="inline-flex items-center gap-2">
                                          ₼{formatFinanceMoney(payment.amount)}
                                          {unusualPayment ? (
                                            <ReviewBadge
                                              label={t.cockpitNeedsReview}
                                              reason={t.cockpitReviewUnusualAmount}
                                            />
                                          ) : null}
                                        </span>
                                      </td>
                                      <td className="px-2 py-2 text-slate-500">{payment.note || '—'}</td>
                                      <td className="px-2 py-2">
                                        <div className="flex gap-1">
                                          <IconActionButton
                                            icon={<Edit2 className="h-4 w-4" />}
                                            tone="edit"
                                            label={t.edit}
                                            onClick={() => openEditPayment(payment)}
                                          />
                                          <IconActionButton
                                            icon={<Trash2 className="h-4 w-4" />}
                                            tone="danger"
                                            label={t.delete}
                                            onClick={() => setDeletePaymentId(payment.id)}
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                    {deletePaymentId === payment.id ? (
                                      <tr>
                                        <td colSpan={5} className="px-2 py-2">
                                          <DangerConfirmRow
                                            message={t.staffDeletePaymentConfirm}
                                            onConfirm={() => void handleDeletePayment(payment.id)}
                                            onCancel={() => setDeletePaymentId(null)}
                                            confirmDisabled={saving}
                                          />
                                        </td>
                                      </tr>
                                    ) : null}
                                  </Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
