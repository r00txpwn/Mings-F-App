import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Plus,
  Receipt,
  Settings2,
  X,
  Trash2,
  Edit2,
} from 'lucide-react';
import {
  supabase,
  TAX_SETTINGS_ID,
  type Employee,
  type TaxPayment,
  type TaxPaymentType,
  type TaxSettings,
} from '../lib/supabase';
import { adminDelete, adminInsert, adminUpdate } from '../lib/adminApi';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/cockpit';
import { DateRangePicker } from '../components/DateRangePicker';
import { SingleDatePicker } from '../components/SingleDatePicker';
import { applyAnalyticsSourceFilter } from '../lib/analyticsSourceFilter';
import {
  DEFAULT_TAX_SETTINGS,
  computePeriodTaxSummary,
} from '../services/finance/taxFinanceService';
import { computePayrollTaxes } from '../services/finance/payrollTax';
import { IconActionButton } from '../components/ui/IconActionButton';
import { DangerConfirmRow } from '../components/ui/DangerConfirmRow';

type Tab = 'overview' | 'settings' | 'payments';

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

export function TaxesScreen() {
  const { t } = useLanguage();
  const toast = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState(getCurrentMonthRange);

  const [settings, setSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [taxPayments, setTaxPayments] = useState<TaxPayment[]>([]);
  const [periodSummary, setPeriodSummary] = useState({
    salesTax: 0,
    payroll: 0,
    employerContributions: 0,
    payrollTaxLiability: 0,
    cashTurnover: 0,
    nonCashTurnover: 0,
  });

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<TaxPayment | null>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [taxType, setTaxType] = useState<TaxPaymentType>('sales');
  const [taxPeriodStart, setTaxPeriodStart] = useState(dateFilter.start);
  const [taxPeriodEnd, setTaxPeriodEnd] = useState(dateFilter.end);
  const [taxPaidDate, setTaxPaidDate] = useState(toLocalDateInput(new Date()));
  const [taxAmount, setTaxAmount] = useState('');
  const [taxNote, setTaxNote] = useState('');

  const loadOverview = useCallback(async () => {
    let salesQuery = supabase
      .from('sales')
      .select('total_price, online_payment_method')
      .gte('sale_date', dateFilter.start)
      .lte('sale_date', `${dateFilter.end}T23:59:59`);

    salesQuery = applyAnalyticsSourceFilter(salesQuery, 'all');

    const [salesRes, empRes, settingsRes, paymentsRes] = await Promise.all([
      salesQuery,
      supabase.from('employees').select('*').eq('is_active', true).order('full_name'),
      supabase.from('tax_settings').select('*').eq('id', TAX_SETTINGS_ID).maybeSingle(),
      supabase.from('tax_payments').select('*').order('paid_date', { ascending: false }),
    ]);

    const taxSettings = (settingsRes.data as TaxSettings | null) ?? DEFAULT_TAX_SETTINGS;
    setSettings(taxSettings);
    if (empRes.data) setEmployees(empRes.data as Employee[]);
    if (paymentsRes.data) setTaxPayments(paymentsRes.data as TaxPayment[]);

    const summary = await computePeriodTaxSummary(
      dateFilter.start,
      dateFilter.end,
      (salesRes.data ?? []) as { total_price: number | string | null; online_payment_method?: string | null }[],
      taxSettings,
    );
    setPeriodSummary(summary);
    setLoading(false);
  }, [dateFilter.end, dateFilter.start]);

  useEffect(() => {
    setLoading(true);
    void loadOverview();
  }, [loadOverview]);

  const employeeTaxRows = useMemo(() => {
    return employees
      .filter((e) => Number(e.official_salary) > 0)
      .map((employee) => {
        const breakdown = computePayrollTaxes(Number(employee.official_salary), settings);
        return { employee, breakdown };
      });
  }, [employees, settings]);

  const totalMonthlyPayrollTax = useMemo(
    () => employeeTaxRows.reduce((sum, row) => sum + row.breakdown.totalPayrollTaxLiability, 0),
    [employeeTaxRows],
  );

  const resetPaymentForm = () => {
    setTaxType('sales');
    setTaxPeriodStart(dateFilter.start);
    setTaxPeriodEnd(dateFilter.end);
    setTaxPaidDate(toLocalDateInput(new Date()));
    setTaxAmount('');
    setTaxNote('');
    setEditingPayment(null);
    setShowPaymentForm(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    const result = await adminUpdate('tax_settings', TAX_SETTINGS_ID, {
      ...settings,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t.taxesSettingsSaved);
    void loadOverview();
  };

  const handleSaveTaxPayment = async () => {
    const amount = Number(taxAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t.taxesInvalidAmount);
      return;
    }
    if (!taxPeriodStart || !taxPeriodEnd) {
      toast.error(t.taxesInvalidPeriod);
      return;
    }

    setSaving(true);
    const payload = {
      tax_type: taxType,
      period_start: taxPeriodStart,
      period_end: taxPeriodEnd,
      amount,
      paid_date: taxPaidDate,
      note: taxNote.trim(),
    };

    const result = editingPayment
      ? await adminUpdate('tax_payments', editingPayment.id, payload)
      : await adminInsert('tax_payments', { ...payload, created_by: user?.id ?? null });

    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(editingPayment ? t.taxesPaymentUpdated : t.taxesPaymentAdded);
    resetPaymentForm();
    void loadOverview();
  };

  const handleDeleteTaxPayment = async (id: string) => {
    setSaving(true);
    const result = await adminDelete('tax_payments', id);
    setSaving(false);
    setDeletePaymentId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t.taxesPaymentDeleted);
    void loadOverview();
  };

  const updateSetting = (key: keyof TaxSettings, value: string) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return;
    setSettings((prev) => ({ ...prev, [key]: num }));
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        eyebrow={t.taxes}
        title={t.taxesScreenTitle}
        description={t.taxesScreenDescription}
      />

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        {t.taxesAccountantNote}
      </div>

      <div className="mb-4 flex gap-1 border-b border-slate-200 dark:border-white/10">
        {(['overview', 'settings', 'payments'] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`cockpit-tab ${activeTab === tab ? 'cockpit-tab-active' : ''}`}
          >
            {tab === 'overview' ? t.taxesTabOverview : tab === 'settings' ? t.taxesTabSettings : t.taxesTabPayments}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="mb-4">
            <DateRangePicker
              startDate={dateFilter.start}
              endDate={dateFilter.end}
              onStartChange={(start) => setDateFilter((prev) => ({ ...prev, start }))}
              onEndChange={(end) => setDateFilter((prev) => ({ ...prev, end }))}
              startLabel={t.startDate}
              endLabel={t.endDate}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cockpit-500" />
            </div>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="cockpit-card p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{t.taxesSalesTaxLabel}</p>
                  <p className="text-2xl font-semibold">₼{periodSummary.salesTax.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.taxesCashTurnover}: ₼{periodSummary.cashTurnover.toFixed(2)} ·{' '}
                    {t.taxesNonCashTurnover}: ₼{periodSummary.nonCashTurnover.toFixed(2)}
                  </p>
                </div>
                <div className="cockpit-card p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{t.taxesPayrollTaxLabel}</p>
                  <p className="text-2xl font-semibold">₼{periodSummary.payrollTaxLiability.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-slate-500">{t.taxesBasedOnOfficialSalary}</p>
                </div>
                <div className="cockpit-card p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{t.taxesEmployerContributionsLabel}</p>
                  <p className="text-2xl font-semibold">₼{periodSummary.employerContributions.toFixed(2)}</p>
                </div>
                <div className="cockpit-card p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{t.taxesSalariesPaidLabel}</p>
                  <p className="text-2xl font-semibold">₼{periodSummary.payroll.toFixed(2)}</p>
                </div>
              </div>

              <div className="cockpit-card mb-6 overflow-hidden">
                <div className="border-b px-4 py-3">
                  <h3 className="font-semibold">{t.taxesEmployeeBreakdownTitle}</h3>
                  <p className="text-sm text-slate-500">
                    {t.taxesMonthlyEstimate.replace('{amount}', totalMonthlyPayrollTax.toFixed(2))}
                  </p>
                </div>
                {employeeTaxRows.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">{t.taxesNoOfficialSalaries}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-slate-500">
                        <th className="px-4 py-2">{t.staffEmployee}</th>
                        <th className="px-4 py-2">{t.staffOfficialSalary}</th>
                        <th className="px-4 py-2">{t.taxesIncomeTax}</th>
                        <th className="px-4 py-2">{t.taxesEmployeeWithheld}</th>
                        <th className="px-4 py-2">{t.taxesEmployerShare}</th>
                        <th className="px-4 py-2">{t.taxesTotalLiability}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeTaxRows.map(({ employee, breakdown }) => (
                        <tr key={employee.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="px-4 py-2">{employee.full_name}</td>
                          <td className="px-4 py-2">₼{Number(employee.official_salary).toFixed(2)}</td>
                          <td className="px-4 py-2">₼{breakdown.incomeTax.toFixed(2)}</td>
                          <td className="px-4 py-2">₼{breakdown.totalEmployeeWithheld.toFixed(2)}</td>
                          <td className="px-4 py-2">₼{breakdown.totalEmployerCost.toFixed(2)}</td>
                          <td className="px-4 py-2 font-medium">₼{breakdown.totalPayrollTaxLiability.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'settings' && (
        <div className="cockpit-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-cockpit-500" />
            <h3 className="font-semibold">{t.taxesTabSettings}</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="text-sm">{t.taxesSalesTaxCashRate}</span>
              <input className="cockpit-input mt-1 w-full" type="number" step="0.001" value={settings.sales_tax_cash_pct} onChange={(e) => updateSetting('sales_tax_cash_pct', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm">{t.taxesSalesTaxNonCashRate}</span>
              <input className="cockpit-input mt-1 w-full" type="number" step="0.001" value={settings.sales_tax_noncash_pct} onChange={(e) => updateSetting('sales_tax_noncash_pct', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm">{t.taxesPitExemptAmount}</span>
              <input className="cockpit-input mt-1 w-full" type="number" step="0.01" value={settings.pit_exempt_amount} onChange={(e) => updateSetting('pit_exempt_amount', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm">{t.taxesPitBracket1Pct}</span>
              <input className="cockpit-input mt-1 w-full" type="number" step="0.001" value={settings.pit_bracket1_pct} onChange={(e) => updateSetting('pit_bracket1_pct', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm">{t.taxesPitBracket2Pct}</span>
              <input className="cockpit-input mt-1 w-full" type="number" step="0.001" value={settings.pit_bracket2_pct} onChange={(e) => updateSetting('pit_bracket2_pct', e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm">{t.taxesPitBracket3Pct}</span>
              <input className="cockpit-input mt-1 w-full" type="number" step="0.001" value={settings.pit_bracket3_pct} onChange={(e) => updateSetting('pit_bracket3_pct', e.target.value)} />
            </label>
          </div>
          <div className="mt-4">
            <button type="button" className="cockpit-btn-primary" disabled={saving} onClick={() => void handleSaveSettings()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t.save}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <>
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              className="cockpit-btn-primary"
              onClick={() => {
                resetPaymentForm();
                setShowPaymentForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t.taxesRecordPayment}
            </button>
          </div>

          {showPaymentForm && (
            <div className="cockpit-card mb-6 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">
                  {editingPayment ? t.taxesEditPayment : t.taxesRecordPayment}
                </h3>
                <button type="button" onClick={resetPaymentForm}>
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm">{t.taxesPaymentType}</span>
                  <select className="cockpit-input mt-1 w-full" value={taxType} onChange={(e) => setTaxType(e.target.value as TaxPaymentType)}>
                    <option value="sales">{t.taxesTypeSales}</option>
                    <option value="payroll">{t.taxesTypePayroll}</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm">{t.amount}</span>
                  <input className="cockpit-input mt-1 w-full" type="number" min="0" step="0.01" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-sm">{t.taxesPeriodStart}</span>
                  <SingleDatePicker value={taxPeriodStart} onChange={setTaxPeriodStart} />
                </label>
                <label className="block">
                  <span className="text-sm">{t.taxesPeriodEnd}</span>
                  <SingleDatePicker value={taxPeriodEnd} onChange={setTaxPeriodEnd} />
                </label>
                <label className="block">
                  <span className="text-sm">{t.taxesPaidDate}</span>
                  <SingleDatePicker value={taxPaidDate} onChange={setTaxPaidDate} />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm">{t.notes}</span>
                  <input className="cockpit-input mt-1 w-full" value={taxNote} onChange={(e) => setTaxNote(e.target.value)} />
                </label>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" className="cockpit-btn-primary" disabled={saving} onClick={() => void handleSaveTaxPayment()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t.save}
                </button>
                <button type="button" className="cockpit-btn-secondary" onClick={resetPaymentForm}>
                  {t.cancel}
                </button>
              </div>
            </div>
          )}

          <div className="cockpit-card overflow-hidden">
            {taxPayments.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Receipt className="mb-3 h-10 w-10 text-slate-400" />
                <p className="text-slate-500">{t.taxesNoPayments}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-slate-500">
                    <th className="px-4 py-2">{t.taxesPaidDate}</th>
                    <th className="px-4 py-2">{t.taxesPaymentType}</th>
                    <th className="px-4 py-2">{t.taxesPeriod}</th>
                    <th className="px-4 py-2">{t.amount}</th>
                    <th className="px-4 py-2">{t.notes}</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {taxPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-2">{payment.paid_date}</td>
                      <td className="px-4 py-2">
                        {payment.tax_type === 'sales' ? t.taxesTypeSales : t.taxesTypePayroll}
                      </td>
                      <td className="px-4 py-2">
                        {payment.period_start} — {payment.period_end}
                      </td>
                      <td className="px-4 py-2 font-medium">₼{Number(payment.amount).toFixed(2)}</td>
                      <td className="px-4 py-2 text-slate-500">{payment.note || '—'}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <IconActionButton
                            icon={<Edit2 className="h-4 w-4" />}
                            tone="edit"
                            label={t.edit}
                            onClick={() => {
                              setEditingPayment(payment);
                              setTaxType(payment.tax_type);
                              setTaxPeriodStart(payment.period_start);
                              setTaxPeriodEnd(payment.period_end);
                              setTaxPaidDate(payment.paid_date);
                              setTaxAmount(String(payment.amount));
                              setTaxNote(payment.note);
                              setShowPaymentForm(true);
                            }}
                          />
                          <IconActionButton icon={<Trash2 className="h-4 w-4" />} tone="danger" label={t.delete} onClick={() => setDeletePaymentId(payment.id)} />
                        </div>
                        {deletePaymentId === payment.id && (
                          <div className="mt-2">
                            <DangerConfirmRow
                              message={t.taxesDeletePaymentConfirm}
                              onConfirm={() => void handleDeleteTaxPayment(payment.id)}
                              onCancel={() => setDeletePaymentId(null)}
                              confirmDisabled={saving}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
