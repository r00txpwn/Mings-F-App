import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, Landmark, Loader2, Plus, Trash2, Wallet } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { supabase, type BankWithdrawal, type CashMovement, type Liability } from '../lib/supabase';
import { adminDelete, adminInsert, adminUpdate } from '../lib/adminApi';
import { PageHeader } from '../components/cockpit';
import { SingleDatePicker } from '../components/SingleDatePicker';
import { computeWithdrawalFee, type WithdrawalMethod } from '../services/finance/withdrawalFees';
import { fetchLiabilitiesSummary } from '../services/finance/supplierFinanceService';
import { fetchCashDrawer } from '../services/finance/cashDrawerService';
import type { CashDrawerResult } from '../services/finance/cashDrawer';

type Tab = 'loans' | 'withdrawals' | 'cash';

function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('en-CA');
}

type LiabilityRow = Liability & { paidAmount: number; outstanding: number };

export function CashDebtScreen() {
  const { t } = useLanguage();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('loans');
  const [loading, setLoading] = useState(true);
  const [liabilities, setLiabilities] = useState<LiabilityRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<BankWithdrawal[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showLiabilityForm, setShowLiabilityForm] = useState(false);
  const [liabilityForm, setLiabilityForm] = useState({
    type: 'loan' as 'loan' | 'other',
    counterparty: '',
    principal_amount: '',
    incurred_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
  });
  const [payLiabilityId, setPayLiabilityId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', paid_date: new Date().toISOString().split('T')[0], payment_method: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    method: 'cashier' as WithdrawalMethod,
    withdrawal_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [cashStart, setCashStart] = useState(startOfMonth);
  const [cashEnd, setCashEnd] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [drawer, setDrawer] = useState<CashDrawerResult | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [cashLoading, setCashLoading] = useState(false);
  const [cashForm, setCashForm] = useState({
    category: 'opening_float' as CashMovement['category'],
    direction: 'in' as CashMovement['direction'],
    amount: '',
    movement_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [deletingCashId, setDeletingCashId] = useState<string | null>(null);

  const cashDirectionLocked = (category: CashMovement['category']): CashMovement['direction'] | null => {
    if (category === 'opening_float') return 'in';
    if (category === 'bank_deposit') return 'out';
    return null;
  };

  const effectiveCashDirection = cashDirectionLocked(cashForm.category) ?? cashForm.direction;

  const withdrawPreview = useMemo(() => {
    const amount = Number(withdrawForm.amount) || 0;
    if (amount <= 0) return null;
    return computeWithdrawalFee(amount, withdrawForm.method);
  }, [withdrawForm.amount, withdrawForm.method]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [liabRes, withdrawalsRes] = await Promise.all([
      fetchLiabilitiesSummary(),
      supabase
        .from('bank_withdrawals')
        .select('*')
        .order('withdrawal_date', { ascending: false })
        .limit(100),
    ]);

    if (liabRes.error) {
      setError(liabRes.error);
      setLoading(false);
      return;
    }
    if (withdrawalsRes.error) {
      setError(withdrawalsRes.error.message);
      setLoading(false);
      return;
    }

    setLiabilities(
      (liabRes.data?.items ?? []).map((item) => ({
        id: item.id,
        type: item.type,
        counterparty: item.counterparty,
        principal_amount: item.principalAmount,
        currency: 'AZN',
        incurred_date: item.incurredDate,
        due_date: item.dueDate,
        notes: item.notes,
        status: item.status,
        created_by: null,
        created_at: '',
        updated_at: '',
        paidAmount: item.paidAmount,
        outstanding: item.outstanding,
      })),
    );
    setWithdrawals((withdrawalsRes.data ?? []) as BankWithdrawal[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateLiability = async () => {
    const principal = Number(liabilityForm.principal_amount);
    if (!liabilityForm.counterparty.trim() || principal <= 0 || saving) return;
    setSaving(true);
    const result = await adminInsert('liabilities', {
      type: liabilityForm.type,
      counterparty: liabilityForm.counterparty.trim(),
      principal_amount: principal,
      incurred_date: liabilityForm.incurred_date,
      due_date: liabilityForm.due_date || null,
      notes: liabilityForm.notes,
      status: 'open',
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? t.errorOccurred);
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.savedSuccessfully);
    setShowLiabilityForm(false);
    setLiabilityForm({
      type: 'loan',
      counterparty: '',
      principal_amount: '',
      incurred_date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: '',
    });
    await loadData();
  };

  const handlePayLiability = async () => {
    if (!payLiabilityId) return;
    const amount = Number(payForm.amount);
    if (amount <= 0 || saving) return;
    setSaving(true);
    const result = await adminInsert('liability_payments', {
      liability_id: payLiabilityId,
      amount,
      paid_date: payForm.paid_date,
      payment_method: payForm.payment_method,
      notes: payForm.notes,
    });
    if (result.ok) {
      const row = liabilities.find((l) => l.id === payLiabilityId);
      if (row) {
        const newPaid = row.paidAmount + amount;
        const newStatus =
          newPaid >= row.principal_amount ? 'settled' : newPaid > 0 ? 'partially_paid' : 'open';
        await adminUpdate('liabilities', payLiabilityId, { status: newStatus });
      }
    }
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? t.errorOccurred);
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.savedSuccessfully);
    setPayLiabilityId(null);
    setPayForm({ amount: '', paid_date: new Date().toISOString().split('T')[0], payment_method: '', notes: '' });
    await loadData();
  };

  const handleLogWithdrawal = async () => {
    const amount = Number(withdrawForm.amount);
    if (amount <= 0 || saving) return;
    const fee = computeWithdrawalFee(amount, withdrawForm.method);
    setSaving(true);
    const result = await adminInsert('bank_withdrawals', {
      amount,
      method: withdrawForm.method,
      fee_rate: fee.rate,
      fee_amount: fee.fee,
      withdrawal_date: withdrawForm.withdrawal_date,
      notes: withdrawForm.notes,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? t.errorOccurred);
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.savedSuccessfully);
    setWithdrawForm({
      amount: '',
      method: 'cashier',
      withdrawal_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    await loadData();
  };

  const loadCash = useCallback(async () => {
    setCashLoading(true);
    const [drawerRes, movementsRes] = await Promise.all([
      fetchCashDrawer({ startDate: cashStart, endDate: cashEnd }),
      supabase
        .from('cash_movements')
        .select('*')
        .order('movement_date', { ascending: false })
        .limit(200),
    ]);
    if (drawerRes.error) {
      setError(drawerRes.error);
    } else {
      setDrawer(drawerRes.data);
    }
    if (!movementsRes.error) {
      setMovements((movementsRes.data ?? []) as CashMovement[]);
    }
    setCashLoading(false);
  }, [cashStart, cashEnd]);

  useEffect(() => {
    if (activeTab === 'cash') void loadCash();
  }, [activeTab, loadCash]);

  const handleAddCashMovement = async () => {
    const amount = Number(cashForm.amount);
    if (amount <= 0 || saving) return;
    setSaving(true);
    const result = await adminInsert('cash_movements', {
      direction: effectiveCashDirection,
      category: cashForm.category,
      amount,
      movement_date: cashForm.movement_date,
      notes: cashForm.notes,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.cashMovementAdded);
    setCashForm({
      category: 'opening_float',
      direction: 'in',
      amount: '',
      movement_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    await loadCash();
  };

  const handleDeleteCashMovement = async (id: string) => {
    if (deletingCashId) return;
    setDeletingCashId(id);
    const result = await adminDelete('cash_movements', id);
    setDeletingCashId(null);
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.cashMovementDeleted);
    await loadCash();
  };

  const withdrawalFeesTotal = withdrawals.reduce((s, w) => s + Number(w.fee_amount ?? 0), 0);

  return (
    <div className="animate-fadeIn space-y-4">
      <PageHeader
        eyebrow={t.operations}
        title={t.cashDebtScreenTitle}
        description={t.cashDebtScreenDescription}
        icon={Landmark}
      />

      {error ? (
        <div className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {activeTab === 'loans' ? (
        <p className="text-sm text-slate-500">{t.cashDebtLoansHelp}</p>
      ) : null}

      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('loans')}
          className={`cockpit-tab flex-1 ${activeTab === 'loans' ? 'cockpit-tab-active' : ''}`}
        >
          {t.cashDebtTabLoans}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('withdrawals')}
          className={`cockpit-tab flex-1 ${activeTab === 'withdrawals' ? 'cockpit-tab-active' : ''}`}
        >
          {t.cashDebtTabWithdrawals}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cash')}
          className={`cockpit-tab flex-1 ${activeTab === 'cash' ? 'cockpit-tab-active' : ''}`}
        >
          {t.cashDrawerTab}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-cockpit-400" />
        </div>
      ) : activeTab === 'loans' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" onClick={() => setShowLiabilityForm(true)} className="cockpit-btn-primary">
              <Plus className="h-4 w-4" />
              {t.liabilityAdd}
            </button>
          </div>

          {showLiabilityForm ? (
            <div className="cockpit-panel space-y-3 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={liabilityForm.type}
                  onChange={(e) =>
                    setLiabilityForm((p) => ({ ...p, type: e.target.value as 'loan' | 'other' }))
                  }
                  className="cockpit-select"
                >
                  <option value="loan">{t.liabilityTypeLoan}</option>
                  <option value="other">{t.liabilityTypeOther}</option>
                </select>
                <input
                  className="cockpit-input"
                  placeholder={t.liabilityLenderOwedTo}
                  value={liabilityForm.counterparty}
                  onChange={(e) => setLiabilityForm((p) => ({ ...p, counterparty: e.target.value }))}
                />
                <p className="text-xs text-slate-500 sm:col-span-2">{t.liabilityLenderHelp}</p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="cockpit-input"
                  placeholder={t.amount}
                  value={liabilityForm.principal_amount}
                  onChange={(e) => setLiabilityForm((p) => ({ ...p, principal_amount: e.target.value }))}
                />
                <SingleDatePicker
                  value={liabilityForm.incurred_date}
                  onChange={(date) => setLiabilityForm((p) => ({ ...p, incurred_date: date }))}
                  placeholder={t.date}
                />
              </div>
              <textarea
                className="cockpit-input resize-none"
                rows={2}
                placeholder={t.notes}
                value={liabilityForm.notes}
                onChange={(e) => setLiabilityForm((p) => ({ ...p, notes: e.target.value }))}
              />
              <div className="flex gap-2">
                <button type="button" disabled={saving} onClick={() => void handleCreateLiability()} className="cockpit-btn-primary">
                  {t.save}
                </button>
                <button type="button" onClick={() => setShowLiabilityForm(false)} className="cockpit-btn-ghost">
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : null}

          {liabilities.length === 0 ? (
            <p className="text-sm text-slate-500">{t.liabilityEmpty}</p>
          ) : (
            <div className="space-y-2">
              {liabilities.map((row) => (
                <div key={row.id} className="cockpit-panel flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-white">{row.counterparty}</p>
                    <p className="text-xs text-slate-500">
                      {row.type === 'loan' ? t.liabilityTypeLoan : t.liabilityTypeOther} · {row.incurred_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-amber-300">₼{row.outstanding.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">
                      / ₼{Number(row.principal_amount).toFixed(2)}
                    </p>
                  </div>
                  {payLiabilityId === row.id ? (
                    <div className="flex w-full flex-wrap gap-2 border-t border-white/10 pt-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="cockpit-input min-w-[120px] flex-1"
                        placeholder={t.amount}
                        value={payForm.amount}
                        onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                      />
                      <SingleDatePicker
                        value={payForm.paid_date}
                        onChange={(date) => setPayForm((p) => ({ ...p, paid_date: date }))}
                        placeholder={t.date}
                      />
                      <button type="button" disabled={saving} onClick={() => void handlePayLiability()} className="cockpit-btn-primary">
                        {t.liabilityRecordPayment}
                      </button>
                      <button type="button" onClick={() => setPayLiabilityId(null)} className="cockpit-btn-ghost">
                        {t.cancel}
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setPayLiabilityId(row.id)} className="cockpit-btn-ghost text-sm">
                      {t.liabilityRecordPayment}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'withdrawals' ? (
        <div className="space-y-4">
          <div className="cockpit-panel space-y-3 p-5">
            <p className="text-sm font-semibold text-slate-200">{t.withdrawalLog}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                min="0"
                step="0.01"
                className="cockpit-input"
                placeholder={t.amount}
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm((p) => ({ ...p, amount: e.target.value }))}
              />
              <select
                value={withdrawForm.method}
                onChange={(e) =>
                  setWithdrawForm((p) => ({ ...p, method: e.target.value as WithdrawalMethod }))
                }
                className="cockpit-select"
              >
                <option value="cashier">{t.withdrawalMethodCashier}</option>
                <option value="abb_atm">{t.withdrawalMethodAbbAtm}</option>
              </select>
              <SingleDatePicker
                value={withdrawForm.withdrawal_date}
                onChange={(date) => setWithdrawForm((p) => ({ ...p, withdrawal_date: date }))}
                placeholder={t.date}
              />
            </div>
            {withdrawPreview ? (
              <p className="text-sm text-slate-400">
                {t.withdrawalFeePreview}: <span className="font-mono text-white">₼{withdrawPreview.fee.toFixed(2)}</span>
              </p>
            ) : null}
            <button type="button" disabled={saving} onClick={() => void handleLogWithdrawal()} className="cockpit-btn-primary">
              <Wallet className="h-4 w-4" />
              {t.withdrawalLog}
            </button>
          </div>

          <p className="text-sm text-slate-500">
            {t.withdrawalFeesPeriodTotal}: ₼{withdrawalFeesTotal.toFixed(2)}
          </p>

          {withdrawals.length === 0 ? (
            <p className="text-sm text-slate-500">{t.withdrawalEmpty}</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">{t.date}</th>
                    <th className="px-4 py-2">{t.amount}</th>
                    <th className="px-4 py-2">{t.withdrawalMethod}</th>
                    <th className="px-4 py-2">{t.withdrawalFee}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-2 font-mono text-slate-300">{w.withdrawal_date}</td>
                      <td className="px-4 py-2 font-mono">₼{Number(w.amount).toFixed(2)}</td>
                      <td className="px-4 py-2 text-slate-400">
                        {w.method === 'cashier' ? t.withdrawalMethodCashier : t.withdrawalMethodAbbAtm}
                      </td>
                      <td className="px-4 py-2 font-mono text-rose-300">₼{Number(w.fee_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">{t.cashDrawerSubtitle}</p>

          <div className="flex flex-wrap items-center gap-2">
            <SingleDatePicker
              value={cashStart}
              onChange={setCashStart}
              placeholder={t.cashOpeningBalance}
            />
            <span className="text-slate-500">—</span>
            <SingleDatePicker value={cashEnd} onChange={setCashEnd} placeholder={t.date} />
          </div>

          {cashLoading || !drawer ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-cockpit-400" />
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="cockpit-panel p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{t.cashOpeningBalance}</p>
                  <p className="mt-1 font-mono text-lg font-bold text-slate-200">₼{drawer.openingBalance.toFixed(2)}</p>
                </div>
                <div className="cockpit-panel p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{t.cashOnHand}</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-emerald-300">₼{drawer.closingBalance.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{t.cashOnHandHint}</p>
                </div>
                <div className="cockpit-panel p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {t.cashInTotal} / {t.cashOutTotal}
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-emerald-300">+₼{drawer.cashIn.total.toFixed(2)}</p>
                  <p className="font-mono text-sm font-bold text-rose-300">−₼{drawer.cashOut.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="cockpit-panel grid gap-2 p-4 text-sm sm:grid-cols-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.cashFromOrders}</span>
                  <span className="font-mono text-emerald-300">+₼{drawer.cashIn.orders.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.cashFromWithdrawals}</span>
                  <span className="font-mono text-emerald-300">+₼{drawer.cashIn.bankWithdrawals.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.cashAdjustmentsIn}</span>
                  <span className="font-mono text-emerald-300">+₼{drawer.cashIn.movementsIn.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.cashToExpenses}</span>
                  <span className="font-mono text-rose-300">−₼{drawer.cashOut.expenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.cashToSuppliers}</span>
                  <span className="font-mono text-rose-300">−₼{drawer.cashOut.supplierPayments.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.cashToLiabilities}</span>
                  <span className="font-mono text-rose-300">−₼{drawer.cashOut.liabilityPayments.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t.cashBankDeposits}</span>
                  <span className="font-mono text-rose-300">−₼{drawer.cashOut.movementsOut.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          <div className="cockpit-panel space-y-3 p-5">
            <p className="text-sm font-semibold text-slate-200">{t.cashAddMovement}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={cashForm.category}
                onChange={(e) =>
                  setCashForm((p) => ({ ...p, category: e.target.value as CashMovement['category'] }))
                }
                className="cockpit-select"
              >
                <option value="opening_float">{t.cashCategoryOpeningFloat}</option>
                <option value="bank_deposit">{t.cashCategoryBankDeposit}</option>
                <option value="adjustment">{t.cashCategoryAdjustment}</option>
                <option value="other">{t.cashCategoryOther}</option>
              </select>
              {cashDirectionLocked(cashForm.category) === null ? (
                <select
                  value={cashForm.direction}
                  onChange={(e) =>
                    setCashForm((p) => ({ ...p, direction: e.target.value as CashMovement['direction'] }))
                  }
                  className="cockpit-select"
                >
                  <option value="in">{t.cashDirectionIn}</option>
                  <option value="out">{t.cashDirectionOut}</option>
                </select>
              ) : (
                <div className="flex items-center rounded-lg border border-white/10 px-3 text-sm text-slate-400">
                  {effectiveCashDirection === 'in' ? t.cashDirectionIn : t.cashDirectionOut}
                </div>
              )}
              <input
                type="number"
                min="0"
                step="0.01"
                className="cockpit-input"
                placeholder={t.amount}
                value={cashForm.amount}
                onChange={(e) => setCashForm((p) => ({ ...p, amount: e.target.value }))}
              />
              <SingleDatePicker
                value={cashForm.movement_date}
                onChange={(date) => setCashForm((p) => ({ ...p, movement_date: date }))}
                placeholder={t.date}
              />
            </div>
            <input
              className="cockpit-input"
              placeholder={t.notes}
              value={cashForm.notes}
              onChange={(e) => setCashForm((p) => ({ ...p, notes: e.target.value }))}
            />
            <button type="button" disabled={saving} onClick={() => void handleAddCashMovement()} className="cockpit-btn-primary">
              <Banknote className="h-4 w-4" />
              {t.cashAddMovement}
            </button>
          </div>

          <p className="text-sm font-semibold text-slate-300">{t.cashMovementLog}</p>
          {movements.length === 0 ? (
            <p className="text-sm text-slate-500">{t.cashMovementEmpty}</p>
          ) : (
            <div className="space-y-2">
              {movements.map((m) => {
                const categoryLabel =
                  m.category === 'opening_float'
                    ? t.cashCategoryOpeningFloat
                    : m.category === 'bank_deposit'
                      ? t.cashCategoryBankDeposit
                      : m.category === 'adjustment'
                        ? t.cashCategoryAdjustment
                        : t.cashCategoryOther;
                return (
                  <div key={m.id} className="cockpit-panel flex items-center justify-between gap-3 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{categoryLabel}</p>
                      <p className="text-xs text-slate-500">
                        {m.movement_date}
                        {m.notes ? ` · ${m.notes}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm font-bold ${m.direction === 'in' ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {m.direction === 'in' ? '+' : '−'}₼{Number(m.amount).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        disabled={deletingCashId === m.id}
                        onClick={() => void handleDeleteCashMovement(m.id)}
                        className="text-slate-400 hover:text-rose-300 disabled:opacity-50"
                        aria-label={t.delete}
                      >
                        {deletingCashId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
