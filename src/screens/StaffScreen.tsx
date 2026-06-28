import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Users,
  Loader2,
  Edit2,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  Banknote,
} from 'lucide-react';
import { supabase, type Employee, type SalaryPayment, type SalaryPaymentType } from '../lib/supabase';
import { adminDelete, adminInsert, adminUpdate } from '../lib/adminApi';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/cockpit';
import { DateRangePicker } from '../components/DateRangePicker';
import { SingleDatePicker } from '../components/SingleDatePicker';
import { IconActionButton } from '../components/ui/IconActionButton';
import { DangerConfirmRow } from '../components/ui/DangerConfirmRow';
import { EmptyState } from '../components/ui/EmptyState';
import { ReviewBadge } from '../components/ui/ReviewBadge';
import { SkeletonCard } from '../components/ui/Skeleton';
import { displayName, isTestRecord } from '../lib/displayName';

type PaymentWithEmployee = SalaryPayment & {
  employees?: { full_name: string; designation: string } | null;
};

const toLocalDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toLocalDateInput(start), end: toLocalDateInput(end) };
};

const PAYMENT_TYPES: SalaryPaymentType[] = ['salary', 'advance', 'bonus', 'partial'];

const UNUSUAL_AMOUNT_THRESHOLD = 10000;

export function StaffScreen() {
  const { t } = useLanguage();
  const toast = useToast();
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payments, setPayments] = useState<PaymentWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState(getCurrentMonthRange);
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
  const [officialSalary, setOfficialSalary] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [hiredAt, setHiredAt] = useState('');
  const [employeeNotes, setEmployeeNotes] = useState('');

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(toLocalDateInput(new Date()));
  const [paymentType, setPaymentType] = useState<SalaryPaymentType>('salary');
  const [paymentNote, setPaymentNote] = useState('');

  const paymentTypeLabel = (type: SalaryPaymentType) => {
    if (type === 'salary') return t.staffPaymentTypeSalary;
    if (type === 'advance') return t.staffPaymentTypeAdvance;
    if (type === 'bonus') return t.staffPaymentTypeBonus;
    return t.staffPaymentTypePartial;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    const [empRes, payRes] = await Promise.all([
      supabase.from('employees').select('*').order('full_name'),
      supabase
        .from('salary_payments')
        .select('*, employees(full_name, designation)')
        .gte('payment_date', dateFilter.start)
        .lte('payment_date', dateFilter.end)
        .order('payment_date', { ascending: false }),
    ]);

    if (empRes.data) setEmployees(empRes.data as Employee[]);
    if (payRes.data) setPayments(payRes.data as PaymentWithEmployee[]);
    setLoading(false);
  }, [dateFilter.end, dateFilter.start]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetEmployeeForm = () => {
    setFullName('');
    setDesignation('');
    setTotalSalary('');
    setOfficialSalary('');
    setIsActive(true);
    setHiredAt('');
    setEmployeeNotes('');
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
    setOfficialSalary(String(employee.official_salary));
    setIsActive(employee.is_active);
    setHiredAt(employee.hired_at ?? '');
    setEmployeeNotes(employee.notes);
    setShowEmployeeForm(true);
  };

  const openAddPayment = (employeeId?: string) => {
    resetPaymentForm();
    if (employeeId) setPaymentEmployeeId(employeeId);
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
    const official = Number(officialSalary);
    if (!fullName.trim()) {
      toast.error(t.staffNameRequired);
      return;
    }
    if (!Number.isFinite(total) || total < 0 || !Number.isFinite(official) || official < 0) {
      toast.error(t.staffInvalidSalary);
      return;
    }
    if (official > total) {
      toast.error(t.staffOfficialExceedsTotal);
      return;
    }

    setSaving(true);
    const payload = {
      full_name: fullName.trim(),
      designation: designation.trim(),
      total_salary: total,
      official_salary: official,
      is_active: isActive,
      hired_at: hiredAt || null,
      notes: employeeNotes.trim(),
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

  const summary = useMemo(() => {
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const activeCount = employees.filter((e) => e.is_active).length;
    const monthlyPayroll = employees
      .filter((e) => e.is_active)
      .reduce((sum, e) => sum + Number(e.total_salary), 0);
    return { totalPaid, activeCount, monthlyPayroll };
  }, [employees, payments]);

  const paymentsByEmployee = useMemo(() => {
    const map = new Map<string, PaymentWithEmployee[]>();
    for (const payment of payments) {
      const list = map.get(payment.employee_id) ?? [];
      list.push(payment);
      map.set(payment.employee_id, list);
    }
    return map;
  }, [payments]);

  return (
    <div className="animate-fadeIn">
      <PageHeader
        eyebrow={t.staff}
        title={t.staffScreenTitle}
        description={t.staffScreenDescription}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="cockpit-btn-secondary" onClick={() => openAddPayment()}>
              <Banknote className="h-4 w-4" />
              {t.staffRecordPayment}
            </button>
            <button
              type="button"
              className="cockpit-btn-primary"
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

      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <DateRangePicker
          startDate={dateFilter.start}
          endDate={dateFilter.end}
          onStartChange={(start) => setDateFilter((prev) => ({ ...prev, start }))}
          onEndChange={(end) => setDateFilter((prev) => ({ ...prev, end }))}
          startLabel={t.startDate}
          endLabel={t.endDate}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="cockpit-card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t.staffActiveEmployees}</p>
          <p className="text-2xl font-semibold">{summary.activeCount}</p>
        </div>
        <div className="cockpit-card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t.staffMonthlyPayrollTarget}</p>
          <p className="text-2xl font-semibold">₼{summary.monthlyPayroll.toFixed(2)}</p>
        </div>
        <div className="cockpit-card p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t.staffPaidInPeriod}</p>
          <p className="text-2xl font-semibold">₼{summary.totalPaid.toFixed(2)}</p>
        </div>
      </div>

      {showEmployeeForm && (
        <div className="cockpit-card mb-6 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">
              {editingEmployee ? t.staffEditEmployee : t.staffAddEmployee}
            </h3>
            <button type="button" onClick={resetEmployeeForm} className="text-slate-500 hover:text-slate-700">
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
              <input className="cockpit-input mt-1 w-full" type="number" min="0" step="0.01" value={totalSalary} onChange={(e) => setTotalSalary(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.staffOfficialSalary}</span>
              <input className="cockpit-input mt-1 w-full" type="number" min="0" step="0.01" value={officialSalary} onChange={(e) => setOfficialSalary(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.staffHiredAt}</span>
              <SingleDatePicker value={hiredAt} onChange={setHiredAt} />
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span className="text-sm">{t.staffActiveLabel}</span>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.notes}</span>
              <input className="cockpit-input mt-1 w-full" value={employeeNotes} onChange={(e) => setEmployeeNotes(e.target.value)} />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" className="cockpit-btn-primary" disabled={saving} onClick={() => void handleSaveEmployee()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t.save}
            </button>
            <button type="button" className="cockpit-btn-secondary" onClick={resetEmployeeForm}>
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
            <button type="button" onClick={resetPaymentForm} className="text-slate-500 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.staffEmployee}</span>
              <select className="cockpit-input mt-1 w-full" value={paymentEmployeeId} onChange={(e) => setPaymentEmployeeId(e.target.value)}>
                <option value="">{t.staffSelectEmployee}</option>
                {employees.filter((e) => e.is_active).map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} — {employee.designation}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-slate-600 dark:text-slate-300">{t.amount}</span>
              <input className="cockpit-input mt-1 w-full" type="number" min="0" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
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
            <button type="button" className="cockpit-btn-primary" disabled={saving} onClick={() => void handleSavePayment()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t.save}
            </button>
            <button type="button" className="cockpit-btn-secondary" onClick={resetPaymentForm}>
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
      ) : employees.filter((e) => !isTestRecord(e.full_name)).length === 0 ? (
        <EmptyState icon={Users} title={t.staffNoEmployees} />
      ) : (
        <div className="space-y-3">
          {employees.filter((e) => !isTestRecord(e.full_name)).map((employee) => {
            const employeePayments = paymentsByEmployee.get(employee.id) ?? [];
            const paidInPeriod = employeePayments.reduce((sum, p) => sum + Number(p.amount), 0);
            const expanded = expandedEmployeeId === employee.id;
            const unusualSalary = Number(employee.total_salary) >= UNUSUAL_AMOUNT_THRESHOLD;

            return (
              <div key={employee.id} className="cockpit-card overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <button
                    type="button"
                    className="text-slate-500"
                    onClick={() => setExpandedEmployeeId(expanded ? null : employee.id)}
                  >
                    {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{displayName(employee.full_name, t.cockpitTestRecordLabel)}</p>
                      {unusualSalary ? (
                        <ReviewBadge label={t.cockpitNeedsReview} reason={t.cockpitReviewUnusualAmount} />
                      ) : null}
                      {!employee.is_active && (
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">
                          {t.staffInactive}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{employee.designation || t.staffNoDesignation}</p>
                    <p className="mt-1 text-sm">
                      {t.staffTotalSalary}: ₼{Number(employee.total_salary).toFixed(2)} ·{' '}
                      {t.staffOfficialSalary}: ₼{Number(employee.official_salary).toFixed(2)} ·{' '}
                      {t.staffPaidInPeriod}: ₼{paidInPeriod.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconActionButton icon={<Banknote className="h-4 w-4" />} label={t.staffRecordPayment} onClick={() => openAddPayment(employee.id)} />
                    <IconActionButton icon={<Edit2 className="h-4 w-4" />} tone="edit" label={t.edit} onClick={() => openEditEmployee(employee)} />
                    <IconActionButton icon={<Trash2 className="h-4 w-4" />} tone="danger" label={t.delete} onClick={() => setDeleteEmployeeId(employee.id)} />
                  </div>
                </div>

                {deleteEmployeeId === employee.id && (
                  <div className="border-t px-4 py-3">
                    <DangerConfirmRow
                      message={t.staffDeleteEmployeeConfirm}
                      onConfirm={() => void handleDeleteEmployee(employee.id)}
                      onCancel={() => setDeleteEmployeeId(null)}
                      confirmDisabled={saving}
                    />
                  </div>
                )}

                {expanded && (
                  <div className="border-t bg-slate-50/50 dark:bg-slate-900/30">
                    {employeePayments.length === 0 ? (
                      <p className="p-4 text-sm text-slate-500">{t.staffNoPaymentsInPeriod}</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs uppercase text-slate-500">
                            <th className="px-4 py-2">{t.date}</th>
                            <th className="px-4 py-2">{t.staffPaymentType}</th>
                            <th className="px-4 py-2">{t.amount}</th>
                            <th className="px-4 py-2">{t.notes}</th>
                            <th className="px-4 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {employeePayments.map((payment) => {
                            const unusualPayment = Number(payment.amount) >= UNUSUAL_AMOUNT_THRESHOLD;
                            return (
                            <tr key={payment.id} className="border-b border-slate-100 dark:border-slate-800">
                              <td className="px-4 py-2">{payment.payment_date}</td>
                              <td className="px-4 py-2">{paymentTypeLabel(payment.payment_type)}</td>
                              <td className="px-4 py-2 font-medium">
                                <span className="inline-flex items-center gap-2">
                                  ₼{Number(payment.amount).toFixed(2)}
                                  {unusualPayment ? (
                                    <ReviewBadge label={t.cockpitNeedsReview} reason={t.cockpitReviewUnusualAmount} />
                                  ) : null}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-slate-500">{payment.note || '—'}</td>
                              <td className="px-4 py-2">
                                <div className="flex gap-1">
                                  <IconActionButton icon={<Edit2 className="h-4 w-4" />} tone="edit" label={t.edit} onClick={() => openEditPayment(payment)} />
                                  <IconActionButton icon={<Trash2 className="h-4 w-4" />} tone="danger" label={t.delete} onClick={() => setDeletePaymentId(payment.id)} />
                                </div>
                                {deletePaymentId === payment.id && (
                                  <div className="mt-2">
                                    <DangerConfirmRow
                                      message={t.staffDeletePaymentConfirm}
                                      onConfirm={() => void handleDeletePayment(payment.id)}
                                      onCancel={() => setDeletePaymentId(null)}
                                      confirmDisabled={saving}
                                    />
                                  </div>
                                )}
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
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
