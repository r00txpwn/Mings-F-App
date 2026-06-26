import { useState, useEffect, useMemo } from 'react';
import { Truck, Plus, Edit2, Trash2, Save, X, Package, ChevronDown, ChevronRight, Wallet, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Supplier } from '../lib/supabase';
import { adminDelete, adminInsert, adminUpdate } from '../lib/adminApi';
import { PageHeader } from '../components/cockpit';
import { SingleDatePicker } from '../components/SingleDatePicker';
import {
  fetchSupplierAccounts,
  type SupplierAccountSummary,
} from '../services/finance/supplierFinanceService';

export function SuppliersScreen() {
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    opening_balance: '',
    opening_balance_date: '',
  });
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [accounts, setAccounts] = useState<SupplierAccountSummary[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [payingSupplierId, setPayingSupplierId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    paid_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    notes: '',
  });
  const [paySaving, setPaySaving] = useState(false);

  const accountBySupplierId = useMemo(
    () => new Map(accounts.map((a) => [a.supplierId, a])),
    [accounts],
  );

  useEffect(() => {
    loadSuppliers();
    loadProductCounts();
    void loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setAccountsLoading(true);
    const res = await fetchSupplierAccounts();
    if (res.data) setAccounts(res.data);
    setAccountsLoading(false);
  };

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (data) {
      setSuppliers(data);
    }
  };

  const loadProductCounts = async () => {
    const { data } = await supabase
      .from('products')
      .select('supplier_id');

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((product) => {
        if (product.supplier_id) {
          counts[product.supplier_id] = (counts[product.supplier_id] || 0) + 1;
        }
      });
      setProductCounts(counts);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      opening_balance: '',
      opening_balance_date: '',
    });
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
      opening_balance: supplier.opening_balance != null ? String(supplier.opening_balance) : '',
      opening_balance_date: supplier.opening_balance_date
        ? String(supplier.opening_balance_date).slice(0, 10)
        : '',
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      opening_balance: '',
      opening_balance_date: '',
    });
  };

  const supplierPayload = () => ({
    name: formData.name,
    contact_person: formData.contact_person,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    notes: formData.notes,
    opening_balance: Number(formData.opening_balance) || 0,
    opening_balance_date: formData.opening_balance_date || null,
  });

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    if (isAdding) {
      await adminInsert('suppliers', supplierPayload());
    } else if (editingId) {
      await adminUpdate('suppliers', editingId, supplierPayload());
    }

    handleCancel();
    loadSuppliers();
    void loadAccounts();
  };

  const handlePaySupplier = async (supplierId: string) => {
    const amount = Number(payForm.amount);
    if (amount <= 0) return;
    setPaySaving(true);
    const result = await adminInsert('supplier_account_payments', {
      supplier_id: supplierId,
      amount,
      paid_date: payForm.paid_date,
      payment_method: payForm.payment_method,
      notes: payForm.notes,
    });
    setPaySaving(false);
    if (!result.ok) return;
    setPayingSupplierId(null);
    setPayForm({
      amount: '',
      paid_date: new Date().toISOString().split('T')[0],
      payment_method: '',
      notes: '',
    });
    void loadAccounts();
  };

  const handleDelete = async (id: string) => {
    await adminDelete('suppliers', id);
    setDeleteConfirm(null);
    loadSuppliers();
    loadProductCounts();
  };

  const handleToggleActive = async (supplier: Supplier) => {
    await adminUpdate('suppliers', supplier.id, { is_active: !supplier.is_active });
    loadSuppliers();
  };

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

            <div>
              <label className="cockpit-label mb-2">{t.supplierOpeningBalance}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.opening_balance}
                onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                className="cockpit-input"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="cockpit-label mb-2">{t.supplierOpeningBalanceDate}</label>
              <SingleDatePicker
                value={formData.opening_balance_date}
                onChange={(date) => setFormData({ ...formData, opening_balance_date: date })}
                placeholder={t.date}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!formData.name.trim()}
              className="cockpit-btn-primary disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
            <button type="button" onClick={handleCancel} className="cockpit-btn-ghost">
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => {
          const isDeleting = deleteConfirm === supplier.id;
          const account = accountBySupplierId.get(supplier.id);
          const isExpanded = expandedAccountId === supplier.id;
          const isPaying = payingSupplierId === supplier.id;

          return (
          <div
            key={supplier.id}
            className={`cockpit-panel p-5 transition-all ${
              isDeleting
                ? 'ring-2 ring-rose-500/80'
                : supplier.is_active
                  ? ''
                  : 'opacity-60'
            }`}
          >
            {isDeleting ? (
              <div className="space-y-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-100">
                <p className="font-semibold">
                  Delete "{supplier.name}"? Associated products will be unlinked.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(supplier.id)}
                    className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(null)}
                    className="cockpit-btn-ghost flex-1 justify-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <Truck className="h-5 w-5 shrink-0 text-cockpit-500" />
                    <h3 className="truncate font-semibold text-slate-900 dark:text-white">{supplier.name}</h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(supplier)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-cockpit-400 dark:text-slate-500"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(supplier.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

            <div className="mb-3 space-y-2">
              {supplier.contact_person && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{t.contact}</span> {supplier.contact_person}
                </p>
              )}
              {supplier.email && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{t.email + ":"}</span> {supplier.email}
                </p>
              )}
              {supplier.phone && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{t.phone + ":"}</span> {supplier.phone}
                </p>
              )}
              {supplier.address && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{t.address + ":"}</span> {supplier.address}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3 dark:border-white/5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                  <Package className="h-3.5 w-3.5" />
                  <span>{productCounts[supplier.id] || 0} products</span>
                </div>
                {accountsLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                ) : account ? (
                  <p
                    className={`font-mono text-xs font-bold ${
                      account.outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {t.supplierOutstanding}: ₼{account.outstanding.toFixed(2)}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {account && account.outstanding > 0 ? (
                  <button
                    type="button"
                    onClick={() => setPayingSupplierId(isPaying ? null : supplier.id)}
                    className="rounded-lg bg-cockpit-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-cockpit-500"
                  >
                    <Wallet className="mr-1 inline h-3 w-3" />
                    {t.supplierPayButton}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setExpandedAccountId(isExpanded ? null : supplier.id)}
                  className="rounded-lg p-1 text-slate-500 hover:text-cockpit-400"
                  aria-label={t.supplierAccountView}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(supplier)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    supplier.is_active
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {supplier.is_active ? t.active : t.inactive}
                </button>
              </div>
            </div>

            {isPaying ? (
              <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
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
                    onClick={() => void handlePaySupplier(supplier.id)}
                    className="cockpit-btn-primary flex-1 text-xs"
                  >
                    {paySaving ? <Loader2 className="h-3 w-3 animate-spin" /> : t.supplierPayButton}
                  </button>
                  <button type="button" onClick={() => setPayingSupplierId(null)} className="cockpit-btn-ghost text-xs">
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : null}

            {isExpanded && account ? (
              <div className="mt-3 space-y-2 border-t border-white/10 pt-3 text-xs">
                {account.openingBalance > 0 ? (
                  <p className="text-slate-400">
                    {t.supplierOpeningBalance}: ₼{account.openingBalance.toFixed(2)}
                    {account.openingBalanceDate ? ` (${account.openingBalanceDate})` : ''}
                    {account.openingRemaining > 0 ? ` · ${t.pending} ₼${account.openingRemaining.toFixed(2)}` : ''}
                  </p>
                ) : null}
                {account.purchases.length > 0 ? (
                  <div className="space-y-1">
                    {account.purchases.slice(0, 8).map((p) => (
                      <div key={p.id} className="flex justify-between text-slate-300">
                        <span>{p.purchaseDate}</span>
                        <span>
                          ₼{p.total.toFixed(2)}{' '}
                          <span
                            className={
                              p.status === 'paid'
                                ? 'text-emerald-400'
                                : p.status === 'partial'
                                  ? 'text-amber-400'
                                  : 'text-slate-500'
                            }
                          >
                            {p.status === 'paid' ? t.paid : p.status === 'partial' ? t.partial : t.pending}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {account.payments.length > 0 ? (
                  <div>
                    <p className="mb-1 font-semibold text-slate-500">{t.supplierRecentPayments}</p>
                    {account.payments.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex justify-between text-slate-400">
                        <span>{p.paidDate}</span>
                        <span className="text-emerald-400">−₼{p.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            </>
            )}
          </div>
          );
        })}
      </div>

      {suppliers.length === 0 && !isAdding && (
        <div className="cockpit-panel py-12 text-center">
          <Truck className="mx-auto mb-3 h-12 w-12 text-slate-400 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.noSuppliersYet}</p>
        </div>
      )}
    </div>
  );
}
