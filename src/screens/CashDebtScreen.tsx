import { useCallback, useEffect, useMemo, useState } from 'react';
import { Landmark, Loader2, Plus, Wallet } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, type BankWithdrawal, type Liability } from '../lib/supabase';
import { adminInsert, adminUpdate } from '../lib/adminApi';
import { PageHeader } from '../components/cockpit';
import { SingleDatePicker } from '../components/SingleDatePicker';
import { computeWithdrawalFee, type WithdrawalMethod } from '../services/finance/withdrawalFees';
import { fetchLiabilitiesSummary } from '../services/finance/supplierFinanceService';

type Tab = 'loans' | 'withdrawals';

type LiabilityRow = Liability & { paidAmount: number; outstanding: number };

export function CashDebtScreen() {
  const { t } = useLanguage();
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
    if (!liabilityForm.counterparty.trim() || principal <= 0) return;
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
      return;
    }
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
    if (amount <= 0) return;
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
      return;
    }
    setPayLiabilityId(null);
    setPayForm({ amount: '', paid_date: new Date().toISOString().split('T')[0], payment_method: '', notes: '' });
    await loadData();
  };

  const handleLogWithdrawal = async () => {
    const amount = Number(withdrawForm.amount);
    if (amount <= 0) return;
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
      return;
    }
    setWithdrawForm({
      amount: '',
      method: 'cashier',
      withdrawal_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    await loadData();
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
      ) : (
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
      )}
    </div>
  );
}
