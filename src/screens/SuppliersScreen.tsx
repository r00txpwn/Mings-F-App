import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Wallet,
  Loader2,
  Info,
  Search,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { supabase, Supplier } from '../lib/supabase';
import { adminDelete, adminInsert, adminUpdate } from '../lib/adminApi';
import { PageHeader } from '../components/cockpit';
import { SingleDatePicker } from '../components/SingleDatePicker';
import {
  fetchSupplierAccounts,
  type SupplierAccountSummary,
} from '../services/finance/supplierFinanceService';
import { displayName, isTestRecord } from '../lib/displayName';

type StatementEntry = {
  key: string;
  date: string;
  label: string;
  delta: number;
  kind: 'manual' | 'purchase' | 'payment';
  debt?: { id: string; amount: number; debtDate: string; notes: string };
  paymentId?: string;
};

function buildStatementEntries(
  account: SupplierAccountSummary,
  t: ReturnType<typeof useLanguage>['t'],
): StatementEntry[] {
  return [
    ...account.manualDebts.map((d) => ({
      key: `m-${d.id}`,
      date: d.debtDate,
      label: d.notes ? `${t.supplierManualDebt} · ${d.notes}` : t.supplierManualDebt,
      delta: d.amount,
      kind: 'manual' as const,
      debt: { id: d.id, amount: d.amount, debtDate: d.debtDate, notes: d.notes },
    })),
    ...account.purchases.map((p) => ({
      key: `p-${p.id}`,
      date: p.purchaseDate,
      label: p.notes ? `${t.supplierDebtFromPurchase} · ${p.notes}` : t.supplierDebtFromPurchase,
      delta: p.total,
      kind: 'purchase' as const,
    })),
    ...account.payments.map((p) => ({
      key: `pay-${p.id}`,
      date: p.paidDate,
      label: p.paymentMethod
        ? `${t.supplierPaymentLabel} · ${p.paymentMethod}`
        : t.supplierPaymentLabel,
      delta: -p.amount,
      kind: 'payment' as const,
      paymentId: p.id,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key));
}

export function SuppliersScreen() {
  const { t } = useLanguage();
  const toast = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [accounts, setAccounts] = useState<SupplierAccountSummary[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [payingSupplierId, setPayingSupplierId] = useState<string | null>(null);
  const [addingDebtSupplierId, setAddingDebtSupplierId] = useState<string | null>(null);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    paid_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    notes: '',
  });
  const [debtForm, setDebtForm] = useState({
    amount: '',
    debt_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [paySaving, setPaySaving] = useState(false);
  const [debtSaving, setDebtSaving] = useState(false);

  const accountBySupplierId = useMemo(
    () => new Map(accounts.map((a) => [a.supplierId, a])),
    [accounts],
  );

  const visibleSuppliers = useMemo(() => {
    const base = suppliers.filter((s) => !isTestRecord(s.name));
    const q = searchTerm.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.contact_person || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q),
    );
  }, [suppliers, searchTerm]);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId) ?? null,
    [suppliers, selectedSupplierId],
  );

  const selectedAccount = selectedSupplierId
    ? accountBySupplierId.get(selectedSupplierId)
    : undefined;

  const closeDrawer = useCallback(() => {
    setSelectedSupplierId(null);
    setPayingSupplierId(null);
    setAddingDebtSupplierId(null);
    setEditingDebtId(null);
    setDeleteConfirm(null);
  }, []);

  useEffect(() => {
    loadSuppliers();
    void loadAccounts();
  }, []);

  useEffect(() => {
    if (!selectedSupplierId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedSupplierId, closeDrawer]);

  const loadAccounts = async () => {
    setAccountsLoading(true);
    const res = await fetchSupplierAccounts();
    if (res.data) setAccounts(res.data);
    setAccountsLoading(false);
  };

  const loadSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('name');
    if (data) setSuppliers(data);
  };

  const resetForm = () => ({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const openDrawer = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setPayingSupplierId(null);
    setAddingDebtSupplierId(null);
    setEditingDebtId(null);
    setDeleteConfirm(null);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData(resetForm());
    closeDrawer();
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setIsAdding(false);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      notes: supplier.notes,
    });
  };

  const handleEditFromDrawer = (supplier: Supplier) => {
    closeDrawer();
    handleEdit(supplier);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(resetForm());
  };

  const supplierPayload = () => ({
    name: formData.name,
    contact_person: formData.contact_person,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    notes: formData.notes,
  });

  const handleSave = async () => {
    if (!formData.name.trim() || savingSupplier) return;
    setSavingSupplier(true);
    const result = isAdding
      ? await adminInsert('suppliers', supplierPayload())
      : editingId
        ? await adminUpdate('suppliers', editingId, supplierPayload())
        : { ok: true };
    setSavingSupplier(false);
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(isAdding ? t.savedSuccessfully : t.updatedSuccessfully);
    handleCancel();
    loadSuppliers();
    void loadAccounts();
  };

  const handlePaySupplier = async (supplierId: string) => {
    const amount = Number(payForm.amount);
    if (amount <= 0 || paySaving) return;
    setPaySaving(true);
    const result = await adminInsert('supplier_account_payments', {
      supplier_id: supplierId,
      amount,
      paid_date: payForm.paid_date,
      payment_method: payForm.payment_method,
      notes: payForm.notes,
    });
    setPaySaving(false);
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.savedSuccessfully);
    setPayingSupplierId(null);
    setPayForm({
      amount: '',
      paid_date: new Date().toISOString().split('T')[0],
      payment_method: '',
      notes: '',
    });
    void loadAccounts();
  };

  const handleDeletePayment = async (paymentId: string) => {
    const result = await adminDelete('supplier_account_payments', paymentId);
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.deletedSuccessfully);
    void loadAccounts();
  };

  const openAddDebt = (supplierId: string) => {
    setAddingDebtSupplierId(supplierId);
    setEditingDebtId(null);
    setPayingSupplierId(null);
    setDebtForm({
      amount: '',
      debt_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const openEditDebt = (
    supplierId: string,
    debt: { id: string; amount: number; debtDate: string; notes: string },
  ) => {
    setAddingDebtSupplierId(null);
    setEditingDebtId(debt.id);
    setPayingSupplierId(null);
    setDebtForm({
      amount: String(debt.amount),
      debt_date: debt.debtDate,
      notes: debt.notes,
    });
    if (selectedSupplierId !== supplierId) {
      setSelectedSupplierId(supplierId);
    }
  };

  const handleSaveDebt = async (supplierId: string) => {
    const amount = Number(debtForm.amount);
    if (amount <= 0 || debtSaving) return;
    setDebtSaving(true);
    const payload = {
      supplier_id: supplierId,
      amount,
      debt_date: debtForm.debt_date,
      notes: debtForm.notes,
    };
    const wasEditing = Boolean(editingDebtId);
    const result = editingDebtId
      ? await adminUpdate('supplier_debts', editingDebtId, payload)
      : await adminInsert('supplier_debts', payload);
    setDebtSaving(false);
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(wasEditing ? t.updatedSuccessfully : t.savedSuccessfully);
    setAddingDebtSupplierId(null);
    setEditingDebtId(null);
    setDebtForm({ amount: '', debt_date: new Date().toISOString().split('T')[0], notes: '' });
    void loadAccounts();
  };

  const handleDeleteDebt = async (debtId: string) => {
    const result = await adminDelete('supplier_debts', debtId);
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.deletedSuccessfully);
    void loadAccounts();
  };

  const handleDelete = async (id: string) => {
    const result = await adminDelete('suppliers', id);
    setDeleteConfirm(null);
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    toast.success(t.deletedSuccessfully);
    if (selectedSupplierId === id) closeDrawer();
    loadSuppliers();
    void loadAccounts();
  };

  const handleToggleActive = async (supplier: Supplier) => {
    const result = await adminUpdate('suppliers', supplier.id, { is_active: !supplier.is_active });
    if (!result.ok) {
      toast.error(result.error ?? t.errorOccurred);
      return;
    }
    loadSuppliers();
  };

  const balanceState = (account: SupplierAccountSummary) => {
    if (account.outstanding > 0) {
      return { text: `${t.supplierYouOwe}: ₼${account.outstanding.toFixed(2)}`, cls: 'text-amber-400' };
    }
    if (account.creditBalance > 0) {
      return { text: `${t.supplierPrepaid}: +₼${account.creditBalance.toFixed(2)}`, cls: 'text-sky-400' };
    }
    return { text: t.supplierSettled, cls: 'text-emerald-400' };
  };

  const hasDebtHistory = (account: SupplierAccountSummary | undefined) =>
    Boolean(
      account &&
        (account.manualDebts.length > 0 ||
          account.purchases.length > 0 ||
          account.payments.length > 0),
    );

  const renderStatement = (supplier: Supplier, account: SupplierAccountSummary) => {
    const entries = buildStatementEntries(account, t);
    const history = hasDebtHistory(account);

    return (
      <div className="space-y-2 text-xs">
        <p className="font-semibold text-slate-400">{t.supplierStatement}</p>
        {history ? (
          <>
            {entries.map((e) => (
              <div key={e.key} className="flex items-center justify-between gap-2 text-slate-300">
                <span className="min-w-0 truncate">
                  <span className="text-slate-500">{e.date}</span> · {e.label}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={`w-20 text-right font-medium ${
                      e.delta < 0 ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {e.delta < 0 ? '−' : '+'}₼{Math.abs(e.delta).toFixed(2)}
                  </span>
                  {e.kind === 'manual' && e.debt ? (
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditDebt(supplier.id, e.debt!)}
                        className="text-slate-500 hover:text-cockpit-400"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteDebt(e.debt!.id)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ) : e.kind === 'payment' && e.paymentId ? (
                    <button
                      type="button"
                      onClick={() => void handleDeletePayment(e.paymentId!)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ) : (
                    <span className="inline-block w-3" />
                  )}
                </span>
              </div>
            ))}
          </>
        ) : (
          <p className="text-slate-500">{t.supplierNoActivity}</p>
        )}
      </div>
    );
  };

  const drawerIsPaying = payingSupplierId === selectedSupplierId;
  const drawerIsAddingDebt = addingDebtSupplierId === selectedSupplierId;
  const drawerIsEditingDebt =
    editingDebtId != null &&
    selectedAccount?.manualDebts.some((d) => d.id === editingDebtId);

  return (
    <div className="animate-fadeIn">
      <PageHeader
        eyebrow={t.procurement}
        title={t.suppliers}
        description={t.manageSuppliers}
        icon={Truck}
        actions={
          !isAdding && !editingId ? (
            <button type="button" onClick={handleAdd} className="cockpit-btn-primary">
              <Plus className="h-4 w-4" />
              {t.addSupplier}
            </button>
          ) : null
        }
      />

      <div className="cockpit-panel mb-6 flex items-start gap-3 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-cockpit-400" />
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {t.supplierAccountExplainer}
        </p>
      </div>

      {(isAdding || editingId) && (
        <div className="cockpit-panel mb-6 p-6">
          <h3 className="cockpit-section-title mb-4">
            {isAdding ? t.addNewSupplier : t.editSupplier}
          </h3>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="cockpit-label mb-2">Supplier Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="cockpit-input"
                placeholder={t.enterSupplierName}
              />
            </div>
            <div>
              <label className="cockpit-label mb-2">{t.contactPerson}</label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="cockpit-input"
                placeholder={t.enterContactPerson}
              />
            </div>
            <div>
              <label className="cockpit-label mb-2">{t.email}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="cockpit-input"
                placeholder={t.enterEmail}
              />
            </div>
            <div>
              <label className="cockpit-label mb-2">{t.phone}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="cockpit-input"
                placeholder={t.enterPhone}
              />
            </div>
            <div className="md:col-span-2">
              <label className="cockpit-label mb-2">{t.address}</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="cockpit-input"
                placeholder={t.enterAddress}
              />
            </div>
            <div className="md:col-span-2">
              <label className="cockpit-label mb-2">{t.notes}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="cockpit-input resize-none"
                placeholder={t.enterNotes}
                rows={3}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!formData.name.trim() || savingSupplier}
              className="cockpit-btn-primary disabled:opacity-40"
            >
              {savingSupplier ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t.save}
            </button>
            <button type="button" onClick={handleCancel} className="cockpit-btn-ghost">
              <X className="h-4 w-4" />
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      <div className="cockpit-panel-solid mb-5 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.supplierSearchPlaceholder}
            className="cockpit-input w-full py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
      </div>

      {visibleSuppliers.length === 0 ? (
        <div className="cockpit-panel py-12 text-center">
          <Truck className="mx-auto mb-3 h-12 w-12 text-slate-400 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {searchTerm.trim() ? t.supplierNoMatches : t.noSuppliersYet}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleSuppliers.map((supplier) => {
            const account = accountBySupplierId.get(supplier.id);
            const balance = account ? balanceState(account) : null;

            return (
              <button
                key={supplier.id}
                type="button"
                onClick={() => openDrawer(supplier.id)}
                className={`cockpit-panel w-full p-4 text-left transition-all hover:ring-2 hover:ring-cockpit-500/40 ${
                  supplier.is_active ? '' : 'opacity-60'
                } ${selectedSupplierId === supplier.id ? 'ring-2 ring-cockpit-500/60' : ''}`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Truck className="h-5 w-5 shrink-0 text-cockpit-500" />
                    <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                      {displayName(supplier.name, t.cockpitTestRecordLabel)}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${
                      supplier.is_active
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {supplier.is_active ? t.active : t.inactive}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {accountsLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                  ) : balance && hasDebtHistory(account) ? (
                    <p className={`font-mono text-sm font-bold ${balance.cls}`}>{balance.text}</p>
                  ) : balance && !hasDebtHistory(account) ? (
                    <p className={`font-mono text-sm font-bold ${balance.cls}`}>{t.supplierSettled}</p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedSupplier && selectedSupplierId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label={t.cancel}
            className="absolute inset-0 bg-black/50"
            onClick={closeDrawer}
          />
          <div
            className="cockpit-panel-solid relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-drawer-title"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 p-4 dark:border-white/5">
              <div className="min-w-0">
                <h2
                  id="supplier-drawer-title"
                  className="truncate text-lg font-semibold text-slate-900 dark:text-white"
                >
                  {displayName(selectedSupplier.name, t.cockpitTestRecordLabel)}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditFromDrawer(selectedSupplier)}
                    className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/15"
                  >
                    <Edit2 className="mr-1 inline h-3 w-3" />
                    {t.edit}
                  </button>
                  {deleteConfirm === selectedSupplier.id ? (
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void handleDelete(selectedSupplier.id)}
                        className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white"
                      >
                        {t.delete}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(null)}
                        className="cockpit-btn-ghost px-2 py-1 text-xs"
                      >
                        {t.cancel}
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(selectedSupplier.id)}
                      className="rounded-lg bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/25"
                    >
                      <Trash2 className="mr-1 inline h-3 w-3" />
                      {t.delete}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleToggleActive(selectedSupplier)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                      selectedSupplier.is_active
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {selectedSupplier.is_active ? t.active : t.inactive}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-200"
                aria-label={t.cancel}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="mb-4 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {selectedSupplier.contact_person ? (
                  <p>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{t.contact}</span>{' '}
                    {selectedSupplier.contact_person}
                  </p>
                ) : null}
                {selectedSupplier.email ? (
                  <p>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{t.email}:</span>{' '}
                    {selectedSupplier.email}
                  </p>
                ) : null}
                {selectedSupplier.phone ? (
                  <p>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{t.phone}:</span>{' '}
                    {selectedSupplier.phone}
                  </p>
                ) : null}
                {selectedSupplier.address ? (
                  <p>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{t.address}:</span>{' '}
                    {selectedSupplier.address}
                  </p>
                ) : null}
                {selectedSupplier.notes ? (
                  <p>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{t.notes}:</span>{' '}
                    {selectedSupplier.notes}
                  </p>
                ) : null}
              </div>

              {accountsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                </div>
              ) : selectedAccount ? (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">
                        {t.supplierTotalSpend}
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-white">
                        ₼{selectedAccount.totalSpend.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">
                        {t.supplierBalanceColumn}
                      </p>
                      <p className={`mt-1 font-mono text-lg font-bold ${balanceState(selectedAccount).cls}`}>
                        {balanceState(selectedAccount).text}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openAddDebt(selectedSupplierId)}
                      className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/15"
                    >
                      <Plus className="mr-1 inline h-3 w-3" />
                      {t.supplierAddDebt}
                    </button>
                    {selectedAccount.outstanding > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPayingSupplierId(drawerIsPaying ? null : selectedSupplierId);
                          setAddingDebtSupplierId(null);
                          setEditingDebtId(null);
                        }}
                        className="rounded-lg bg-cockpit-600 px-3 py-2 text-xs font-bold text-white hover:bg-cockpit-500"
                      >
                        <Wallet className="mr-1 inline h-3 w-3" />
                        {t.supplierClearDebt}
                      </button>
                    ) : null}
                  </div>

                  {drawerIsPaying ? (
                    <div className="mb-4 space-y-2 rounded-lg border border-white/10 p-3">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        className="cockpit-input w-full text-sm"
                        placeholder={t.amount}
                        value={payForm.amount}
                        onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                      />
                      <SingleDatePicker
                        value={payForm.paid_date}
                        onChange={(date) => setPayForm((p) => ({ ...p, paid_date: date }))}
                        placeholder={t.date}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={paySaving}
                          onClick={() => void handlePaySupplier(selectedSupplierId)}
                          className="cockpit-btn-primary flex-1 text-xs"
                        >
                          {paySaving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            t.supplierClearDebt
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayingSupplierId(null)}
                          className="cockpit-btn-ghost text-xs"
                        >
                          {t.cancel}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {drawerIsAddingDebt || drawerIsEditingDebt ? (
                    <div className="mb-4 space-y-2 rounded-lg border border-white/10 p-3">
                      <p className="text-xs font-semibold text-slate-400">
                        {editingDebtId ? t.edit : t.supplierAddDebt}
                      </p>
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        {t.supplierAddDebtHint}
                      </p>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        className="cockpit-input w-full text-sm"
                        placeholder={t.amount}
                        value={debtForm.amount}
                        onChange={(e) => setDebtForm((p) => ({ ...p, amount: e.target.value }))}
                      />
                      <SingleDatePicker
                        value={debtForm.debt_date}
                        onChange={(date) => setDebtForm((p) => ({ ...p, debt_date: date }))}
                        placeholder={t.date}
                      />
                      <textarea
                        className="cockpit-input w-full resize-none text-sm"
                        rows={2}
                        placeholder={t.notes}
                        value={debtForm.notes}
                        onChange={(e) => setDebtForm((p) => ({ ...p, notes: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={debtSaving}
                          onClick={() => void handleSaveDebt(selectedSupplierId)}
                          className="cockpit-btn-primary flex-1 text-xs"
                        >
                          {debtSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : t.save}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingDebtSupplierId(null);
                            setEditingDebtId(null);
                          }}
                          className="cockpit-btn-ghost text-xs"
                        >
                          {t.cancel}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {renderStatement(selectedSupplier, selectedAccount)}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
