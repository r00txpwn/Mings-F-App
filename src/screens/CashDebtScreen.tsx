import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, ArrowRight, CreditCard, Landmark, Loader2, Plus, SlidersHorizontal, Trash2, Wallet } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { supabase, type BankWithdrawal, type CashMovement, type FinanceAccount, type Liability } from '../lib/supabase';
import { adminDelete, adminInsert, adminUpdate, adminUpsert } from '../lib/adminApi';
import { PageHeader } from '../components/cockpit';
import { SingleDatePicker } from '../components/SingleDatePicker';
import { displayName, isTestRecord } from '../lib/displayName';
import { computeWithdrawalFee, type WithdrawalMethod } from '../services/finance/withdrawalFees';
import { fetchLiabilitiesSummary } from '../services/finance/supplierFinanceService';
import { fetchCashDrawer } from '../services/finance/cashDrawerService';
import { fetchAccountBalances } from '../services/finance/accountsService';
import { fetchAccountLedger } from '../services/finance/accountLedgerService';
import type { AccountLedgerEntry, AccountLedgerType } from '../services/finance/accountLedger';
import type { AccountBalances } from '../services/finance/accounts';
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
  const [deletingWithdrawalId, setDeletingWithdrawalId] = useState<string | null>(null);
  const [accountBalances, setAccountBalances] = useState<AccountBalances | null>(null);
  const [financeAccounts, setFinanceAccounts] = useState<FinanceAccount[]>([]);
  const [openingForm, setOpeningForm] = useState({
    bank: { balance: '', date: new Date().toISOString().split('T')[0] },
    card: { balance: '', date: new Date().toISOString().split('T')[0] },
  });
  const [transferForm, setTransferForm] = useState({
    amount: '',
    transfer_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [ledger, setLedger] = useState<AccountLedgerEntry[]>([]);
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'bank' | 'card'>('all');
  const [deletingTransferId, setDeletingTransferId] = useState<string | null>(null);

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

  // ATM withdrawals draw from the Card account; cashier withdrawals from the Bank account.
  const withdrawSource: 'bank' | 'card' = withdrawForm.method === 'abb_atm' ? 'card' : 'bank';
  const withdrawSourceLabel = withdrawSource === 'card' ? t.accountCard : t.accountBank;
  const withdrawAvailable = accountBalances
    ? withdrawSource === 'card'
      ? accountBalances.card
      : accountBalances.bank
    : null;
  const withdrawAmountNum = Number(withdrawForm.amount) || 0;
  const withdrawExceeds = withdrawAvailable != null && withdrawAmountNum > withdrawAvailable;

  const loadAccountBalances = useCallback(async () => {
    const [balancesRes, accountsRes, ledgerRes] = await Promise.all([
      fetchAccountBalances(),
      supabase.from('finance_accounts').select('*').in('key', ['bank', 'card']),
      fetchAccountLedger(),
    ]);
    if (balancesRes.data) setAccountBalances(balancesRes.data);
    if (ledgerRes.data) setLedger(ledgerRes.data);
    if (!accountsRes.error && accountsRes.data) {
      const rows = accountsRes.data as FinanceAccount[];
      setFinanceAccounts(rows);
      const bank = rows.find((row) => row.key === 'bank');
      const card = rows.find((row) => row.key === 'card');
      setOpeningForm({
        bank: {
          balance: bank ? String(bank.opening_balance) : '',
          date: bank?.opening_date ?? new Date().toISOString().split('T')[0],
        },
        card: {
          balance: card ? String(card.opening_balance) : '',
          date: card?.opening_date ?? new Date().toISOString().split('T')[0],
        },
      });
    }
  }, []);

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
    await loadAccountBalances();
    setLoading(false);
  }, [loadAccountBalances]);

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

  const handleSaveOpeningBalance = async (key: 'bank' | 'card') => {
    const draft = openingForm[key];
    const amount = Number(draft.balance);
    if (!Number.isFinite(amount) || amount < 0 || saving) return;
    setSaving(true);
    const existing = financeAccounts.find((row) => row.key === key);
    const result = await adminUpsert('finance_accounts', {
      key,
      name: existing?.name ?? (key === 'bank' ? 'Main (Bank) Account' : 'Card Account'),
      opening_balance: amount,
      opening_date: draft.date,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.accountOpeningBalanceSaved);
    await loadAccountBalances();
  };

  const handleBankToCardTransfer = async () => {
    const amount = Number(transferForm.amount);
    if (amount <= 0 || saving) return;
    setSaving(true);
    const result = await adminInsert('account_transfers', {
      from_account: 'bank',
      to_account: 'card',
      amount,
      fee_amount: 0,
      transfer_date: transferForm.transfer_date,
      notes: transferForm.notes,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.accountTransferSaved);
    setTransferForm({
      amount: '',
      transfer_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    await loadAccountBalances();
  };

  const handleDeleteTransfer = async (id: string) => {
    if (deletingTransferId) return;
    setDeletingTransferId(id);
    const result = await adminDelete('account_transfers', id);
    setDeletingTransferId(null);
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.accountTransferDeleted);
    await loadAccountBalances();
  };

  const handleLogWithdrawal = async () => {
    const amount = Number(withdrawForm.amount);
    if (amount <= 0 || saving) return;
    const source: 'bank' | 'card' = withdrawForm.method === 'abb_atm' ? 'card' : 'bank';
    const available = accountBalances
      ? source === 'card'
        ? accountBalances.card
        : accountBalances.bank
      : null;
    if (available != null && amount > available) {
      const label = source === 'card' ? t.accountCard : t.accountBank;
      toast.error(
        t.withdrawalInsufficientFunds
          .replace('{account}', label)
          .replace('{available}', `₼${available.toFixed(2)}`),
      );
      return;
    }
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
    await loadAccountBalances();
  };

  const handleDeleteWithdrawal = async (id: string) => {
    if (deletingWithdrawalId) return;
    setDeletingWithdrawalId(id);
    const result = await adminDelete('bank_withdrawals', id);
    setDeletingWithdrawalId(null);
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.deletedSuccessfully);
    await loadData();
    await loadAccountBalances();
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
    await loadAccountBalances();
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
    await loadAccountBalances();
  };

  const withdrawalFeesTotal = withdrawals.reduce((s, w) => s + Number(w.fee_amount ?? 0), 0);

  const liabilityStatusLabel = (status: Liability['status']) => {
    if (status === 'settled') return t.liabilityStatusSettled;
    if (status === 'partially_paid') return t.liabilityStatusPartial;
    return t.liabilityStatusOpen;
  };

  const ledgerTypeLabel = (type: AccountLedgerType) => {
    switch (type) {
      case 'opening':
        return t.accountLedgerOpening;
      case 'transfer_in':
        return t.accountLedgerTransferIn;
      case 'transfer_out':
        return t.accountLedgerTransferOut;
      case 'withdrawal':
        return t.accountLedgerWithdrawal;
      case 'expense':
        return t.accountLedgerExpense;
      case 'purchase':
        return t.accountLedgerPurchase;
      case 'payout':
        return t.accountLedgerPayout;
    }
  };

  const filteredLedger = useMemo(
    () => (ledgerFilter === 'all' ? ledger : ledger.filter((entry) => entry.account === ledgerFilter)),
    [ledger, ledgerFilter],
  );

  return (
    <div className="animate-fadeIn space-y-4">
      <PageHeader
        eyebrow={t.operations}
        title={t.cashDebtScreenTitle}
        description={t.cashDebtScreenDescription}
        icon={Landmark}
      />

      {error ? (
        <div className="cockpit-alert-error">{error}</div>
      ) : null}

      {accountBalances ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="cockpit-section-title">{t.accountBalancesTitle}</h2>
            <button
              type="button"
              onClick={() => setShowAccountSetup((prev) => !prev)}
              className="cockpit-btn-ghost cursor-pointer"
              aria-expanded={showAccountSetup}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showAccountSetup ? t.cancel : t.accountManage}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="cockpit-panel p-4 transition-colors hover:border-emerald-500/30">
              <div className="mb-3 inline-flex rounded-lg bg-emerald-500/10 p-2">
                <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="cockpit-label !mb-1">{t.accountCash}</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-emerald-300">
                ₼{accountBalances.cash.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.cashOnHandHint}</p>
            </div>
            <div className="cockpit-panel p-4 transition-colors hover:border-sky-500/30">
              <div className="mb-3 inline-flex rounded-lg bg-sky-500/10 p-2">
                <Landmark className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <p className="cockpit-label !mb-1">{t.accountBank}</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-sky-300">
                ₼{accountBalances.bank.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.accountBankHint}</p>
            </div>
            <div className="cockpit-panel p-4 transition-colors hover:border-violet-500/30">
              <div className="mb-3 inline-flex rounded-lg bg-violet-500/10 p-2">
                <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="cockpit-label !mb-1">{t.accountCard}</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-violet-300">
                ₼{accountBalances.card.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.accountCardHint}</p>
            </div>
          </div>

          {showAccountSetup ? (
            <div className="cockpit-panel animate-fadeIn space-y-6 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.accountSetupTitle}</h3>

              <div className="space-y-3">
                <p className="cockpit-section-title">{t.accountOpeningBalance}</p>
                {(['bank', 'card'] as const).map((key) => {
                  const currentBalance = key === 'bank' ? accountBalances.bank : accountBalances.card;
                  const Icon = key === 'bank' ? Landmark : CreditCard;
                  const iconClass =
                    key === 'bank'
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-500/10'
                      : 'text-violet-600 dark:text-violet-400 bg-violet-500/10';
                  return (
                    <div key={key} className="cockpit-inset space-y-3 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-lg p-1.5 ${iconClass}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {key === 'bank' ? t.accountBank : t.accountCard}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {t.accountCurrentBalance}:{' '}
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                            ₼{currentBalance.toFixed(2)}
                          </span>
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <label className="block">
                          <span className="cockpit-label">{t.accountOpeningBalance}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="cockpit-input-lg"
                            placeholder="0.00"
                            value={openingForm[key].balance}
                            onChange={(e) =>
                              setOpeningForm((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], balance: e.target.value },
                              }))
                            }
                          />
                        </label>
                        <label className="block">
                          <span className="cockpit-label">{t.accountOpeningDate}</span>
                          <SingleDatePicker
                            value={openingForm[key].date}
                            onChange={(date) =>
                              setOpeningForm((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], date },
                              }))
                            }
                            placeholder={t.accountOpeningDate}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleSaveOpeningBalance(key)}
                          className="cockpit-btn-secondary w-full sm:w-auto"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          {t.save}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-700">
                <p className="cockpit-section-title">{t.accountTransferBankToCard}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{t.accountBank}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden />
                  <span className="font-medium text-slate-700 dark:text-slate-200">{t.accountCard}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {t.accountCurrentBalance} ({t.accountBank}):{' '}
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                    ₼{accountBalances.bank.toFixed(2)}
                  </span>
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="cockpit-label">{t.amount}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="cockpit-input-lg"
                      placeholder="0.00"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm((p) => ({ ...p, amount: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="cockpit-label">{t.date}</span>
                    <SingleDatePicker
                      value={transferForm.transfer_date}
                      onChange={(date) => setTransferForm((p) => ({ ...p, transfer_date: date }))}
                      placeholder={t.date}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="cockpit-label">{t.notes}</span>
                  <input
                    className="cockpit-input"
                    placeholder={t.notes}
                    value={transferForm.notes}
                    onChange={(e) => setTransferForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleBankToCardTransfer()}
                  className="cockpit-btn-primary"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {t.accountTransferAction}
                </button>
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="cockpit-section-title">{t.accountActivityTitle}</p>
                  <div className="flex gap-1">
                    {(['all', 'bank', 'card'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setLedgerFilter(f)}
                        className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                          ledgerFilter === f
                            ? 'bg-cockpit-600 text-white dark:bg-cockpit-500'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                        }`}
                      >
                        {f === 'all' ? t.accountActivityFilterAll : f === 'bank' ? t.accountBank : t.accountCard}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredLedger.length === 0 ? (
                  <p className="text-sm text-slate-500">{t.accountActivityEmpty}</p>
                ) : (
                  <div className="space-y-2">
                    {filteredLedger.map((entry) => {
                      const isIncoming = entry.amount >= 0;
                      const accountLabel = entry.account === 'bank' ? t.accountBank : t.accountCard;
                      return (
                        <div
                          key={entry.key}
                          className="cockpit-inset flex items-center justify-between gap-3 p-3"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {ledgerTypeLabel(entry.type)}
                              </span>
                              <span className="neon-badge">{accountLabel}</span>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {entry.date}
                              {entry.detail ? ` · ${entry.detail}` : ''}
                              {entry.type === 'expense' || entry.type === 'purchase'
                                ? ` · ${t.accountLedgerManagedElsewhere}`
                                : entry.type === 'payout'
                                ? ` · ${t.accountLedgerManagedPayouts}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span
                              className={`font-mono text-sm font-bold tabular-nums ${
                                isIncoming
                                  ? 'text-emerald-600 dark:text-emerald-300'
                                  : 'text-rose-600 dark:text-rose-300'
                              }`}
                            >
                              {isIncoming ? '+' : '−'}₼{Math.abs(entry.amount).toFixed(2)}
                            </span>
                            {entry.deletable === 'transfer' && entry.recordId ? (
                              <button
                                type="button"
                                disabled={deletingTransferId === entry.recordId}
                                onClick={() => void handleDeleteTransfer(entry.recordId as string)}
                                className="cursor-pointer text-slate-400 transition-colors hover:text-rose-500 disabled:opacity-50 dark:hover:text-rose-300"
                                aria-label={t.delete}
                              >
                                {deletingTransferId === entry.recordId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            ) : entry.deletable === 'withdrawal' && entry.recordId ? (
                              <button
                                type="button"
                                disabled={deletingWithdrawalId === entry.recordId}
                                onClick={() => void handleDeleteWithdrawal(entry.recordId as string)}
                                className="cursor-pointer text-slate-400 transition-colors hover:text-rose-500 disabled:opacity-50 dark:hover:text-rose-300"
                                aria-label={t.delete}
                              >
                                {deletingWithdrawalId === entry.recordId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <span className="w-4" aria-hidden />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeTab === 'loans' ? (
        <p className="text-sm text-slate-500">{t.cashDebtLoansHelp}</p>
      ) : null}

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/50">
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

          {liabilities.filter((row) => !isTestRecord(row.counterparty)).length === 0 ? (
            <p className="text-sm text-slate-500">{t.liabilityEmpty}</p>
          ) : (
            <div className="space-y-2">
              {liabilities.filter((row) => !isTestRecord(row.counterparty)).map((row) => (
                <div key={row.id} className="cockpit-panel flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {displayName(row.counterparty, t.cockpitTestRecordLabel)}
                      </p>
                      <span
                        className={`neon-badge ${
                          row.status === 'settled'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : row.status === 'partially_paid'
                              ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : ''
                        }`}
                      >
                        {liabilityStatusLabel(row.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.type === 'loan' ? t.liabilityTypeLoan : t.liabilityTypeOther} · {row.incurred_date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-bold tabular-nums text-amber-600 dark:text-amber-300">
                      ₼{row.outstanding.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">
                      / ₼{Number(row.principal_amount).toFixed(2)}
                    </p>
                  </div>
                  {payLiabilityId === row.id ? (
                    <div className="flex w-full flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
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
          <div className="cockpit-panel space-y-4 p-5">
            <p className="cockpit-section-title">{t.withdrawalLog}</p>
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
                <option value="abb_atm">{t.withdrawalMethodCardAccount}</option>
              </select>
              <SingleDatePicker
                value={withdrawForm.withdrawal_date}
                onChange={(date) => setWithdrawForm((p) => ({ ...p, withdrawal_date: date }))}
                placeholder={t.date}
              />
            </div>
            {withdrawPreview ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t.withdrawalFeePreview}:{' '}
                <span className="font-mono text-slate-900 dark:text-white">₼{withdrawPreview.fee.toFixed(2)}</span>
              </p>
            ) : null}
            {withdrawAvailable != null ? (
              <p
                className={`text-sm ${
                  withdrawExceeds
                    ? 'font-medium text-rose-600 dark:text-rose-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {(withdrawExceeds ? t.withdrawalInsufficientFunds : t.withdrawalAvailableInAccount)
                  .replace('{account}', withdrawSourceLabel)
                  .replace('{available}', `₼${withdrawAvailable.toFixed(2)}`)}
              </p>
            ) : null}
            <button
              type="button"
              disabled={saving || withdrawExceeds}
              onClick={() => void handleLogWithdrawal()}
              className="cockpit-btn-primary"
            >
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
            <div className="cockpit-table-wrap">
              <table className="w-full text-sm">
                <thead className="cockpit-thead">
                  <tr>
                    <th className="cockpit-th">{t.date}</th>
                    <th className="cockpit-th">{t.amount}</th>
                    <th className="cockpit-th">{t.withdrawalMethod}</th>
                    <th className="cockpit-th">{t.withdrawalFee}</th>
                    <th className="cockpit-th text-right">{t.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="cockpit-tr">
                      <td className="cockpit-td font-mono tabular-nums">{w.withdrawal_date}</td>
                      <td className="cockpit-td font-mono font-semibold tabular-nums">₼{Number(w.amount).toFixed(2)}</td>
                      <td className="cockpit-td text-slate-500 dark:text-slate-400">
                        {w.method === 'cashier' ? t.withdrawalMethodCashier : t.withdrawalMethodCardAccount}
                      </td>
                      <td className="cockpit-td font-mono tabular-nums text-rose-600 dark:text-rose-300">
                        ₼{Number(w.fee_amount).toFixed(2)}
                      </td>
                      <td className="cockpit-td text-right">
                        <button
                          type="button"
                          disabled={deletingWithdrawalId === w.id}
                          onClick={() => void handleDeleteWithdrawal(w.id)}
                          className="cursor-pointer text-slate-400 transition-colors hover:text-rose-500 disabled:opacity-50 dark:hover:text-rose-300"
                          aria-label={t.delete}
                        >
                          {deletingWithdrawalId === w.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.cashDrawerSubtitle}</p>

          <div className="flex flex-wrap items-center gap-2">
            <SingleDatePicker
              value={cashStart}
              onChange={setCashStart}
              placeholder={t.cashOpeningBalance}
            />
            <span className="text-slate-400">—</span>
            <SingleDatePicker value={cashEnd} onChange={setCashEnd} placeholder={t.date} />
          </div>

          {cashLoading || !drawer ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-cockpit-400" />
            </div>
          ) : (
            <>
              <p className="cockpit-section-title">{t.cashDrawerTitle}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="cockpit-panel p-4">
                  <p className="cockpit-label !mb-1">{t.cashOpeningBalance}</p>
                  <p className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-slate-200">
                    ₼{drawer.openingBalance.toFixed(2)}
                  </p>
                </div>
                <div className="cockpit-panel p-4">
                  <p className="cockpit-label !mb-1">{t.cashOnHand}</p>
                  <p className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-300">
                    ₼{drawer.closingBalance.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{t.cashOnHandHint}</p>
                </div>
                <div className="cockpit-panel p-4">
                  <p className="cockpit-label !mb-1">
                    {t.cashInTotal} / {t.cashOutTotal}
                  </p>
                  <p className="font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-300">
                    +₼{drawer.cashIn.total.toFixed(2)}
                  </p>
                  <p className="font-mono text-sm font-bold tabular-nums text-rose-600 dark:text-rose-300">
                    −₼{drawer.cashOut.total.toFixed(2)}
                  </p>
                </div>
              </div>

              <p className="cockpit-section-title">{t.cashDrawerTab}</p>
              <div className="cockpit-panel grid gap-2 p-4 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <span className="text-slate-600 dark:text-slate-400">{t.cashFromOrders}</span>
                  <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-300">
                    +₼{drawer.cashIn.orders.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <span className="text-slate-600 dark:text-slate-400">{t.cashFromWithdrawals}</span>
                  <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-300">
                    +₼{drawer.cashIn.bankWithdrawals.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <span className="text-slate-600 dark:text-slate-400">{t.cashAdjustmentsIn}</span>
                  <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-300">
                    +₼{drawer.cashIn.movementsIn.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <span className="text-slate-600 dark:text-slate-400">{t.cashFromPayouts}</span>
                  <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-300">
                    +₼{drawer.cashIn.payouts.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <span className="text-slate-600 dark:text-slate-400">{t.cashToExpenses}</span>
                  <span className="font-mono tabular-nums text-rose-600 dark:text-rose-300">
                    −₼{drawer.cashOut.expenses.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <span className="text-slate-600 dark:text-slate-400">{t.cashToPurchases}</span>
                  <span className="font-mono tabular-nums text-rose-600 dark:text-rose-300">
                    −₼{drawer.cashOut.purchases.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <span className="text-slate-600 dark:text-slate-400">{t.cashToSuppliers}</span>
                  <span className="font-mono tabular-nums text-rose-600 dark:text-rose-300">
                    −₼{drawer.cashOut.supplierPayments.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <span className="text-slate-600 dark:text-slate-400">{t.cashToLiabilities}</span>
                  <span className="font-mono tabular-nums text-rose-600 dark:text-rose-300">
                    −₼{drawer.cashOut.liabilityPayments.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <span className="text-slate-600 dark:text-slate-400">{t.cashBankDeposits}</span>
                  <span className="font-mono tabular-nums text-rose-600 dark:text-rose-300">
                    −₼{drawer.cashOut.movementsOut.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="cockpit-panel space-y-4 p-5">
            <p className="cockpit-section-title">{t.cashAddMovement}</p>
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
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-400">
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

          <p className="cockpit-section-title">{t.cashMovementLog}</p>
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
                  <div
                    key={m.id}
                    className="cockpit-panel flex items-center justify-between gap-3 p-3 transition-colors hover:border-slate-300 dark:hover:border-slate-600"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{categoryLabel}</p>
                      <p className="text-xs text-slate-500">
                        {m.movement_date}
                        {m.notes ? ` · ${m.notes}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`font-mono text-sm font-bold tabular-nums ${
                          m.direction === 'in'
                            ? 'text-emerald-600 dark:text-emerald-300'
                            : 'text-rose-600 dark:text-rose-300'
                        }`}
                      >
                        {m.direction === 'in' ? '+' : '−'}₼{Number(m.amount).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        disabled={deletingCashId === m.id}
                        onClick={() => void handleDeleteCashMovement(m.id)}
                        className="cursor-pointer text-slate-400 transition-colors hover:text-rose-500 disabled:opacity-50 dark:hover:text-rose-300"
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
