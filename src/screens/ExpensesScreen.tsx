import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, DollarSign, ShoppingCart, Search, X, ChevronDown, Settings2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { adminDelete, adminInsert, adminUpdate } from '../lib/adminApi';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { ExpensesSummaryBar } from './expenses/ExpensesSummaryBar';
import { CategoryGroupedView } from './expenses/CategoryGroupedView';
import { ManageCategoriesTab } from './expenses/ManageCategoriesTab';
import { PageHeader } from '../components/cockpit';
import { displayName, isTestRecord } from '../lib/displayName';
import { DateRangePicker } from '../components/DateRangePicker';
import { SingleDatePicker } from '../components/SingleDatePicker';
import { isOnCreditFromPurchase, purchaseCreditFields } from '../services/finance/purchaseCredit';

interface MasterCategory {
  id: string;
  name: string;
  description: string;
  type: 'expense' | 'purchase';
  color: string;
  icon: string;
}

interface SubItem {
  id: string;
  name: string;
  master_category_id: string;
  created_at: string;
}

interface OperationalExpense {
  id: string;
  master_category_id: string | null;
  expense_item_id: string | null;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: string;
  master_categories?: { name: string; color: string };
  expense_items?: { name: string };
}

interface Purchase {
  id: string;
  product_id?: string | null;
  supplier_id: string | null;
  master_category_id: string | null;
  expense_item_id: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  purchase_date: string;
  payment_status: 'pending' | 'partial' | 'paid';
  is_on_credit?: boolean;
  notes: string;
  products?: { name: string; unit: string };
  suppliers?: { name: string };
  master_categories?: { name: string; color: string };
  expense_items?: { name: string };
}

interface Supplier {
  id: string;
  name: string;
}

type ActiveTab = 'operational' | 'cogs' | 'categories';
type PurchasePriceSuggestion = {
  unit_cost: number;
  supplier_id: string | null;
  supplier_name: string;
  purchase_date: string;
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

export function ExpensesScreen() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ActiveTab>('operational');
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [subItems, setSubItems] = useState<SubItem[]>([]);
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OperationalExpense | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(() => getCurrentMonthRange());

  const [savingExpense, setSavingExpense] = useState(false);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expenseFormError, setExpenseFormError] = useState<string | null>(null);
  const [purchaseFormError, setPurchaseFormError] = useState<string | null>(null);
  const toast = useToast();

  const flashSuccess = (message: string) => {
    toast.success(message);
  };

  const flashError = (message: string) => {
    toast.error(message);
  };

  useEffect(() => {
    loadAllData(true);
  }, []);

  const loadAllData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    const [catRes, itemsRes, expRes, purRes, suppRes] = await Promise.all([
      supabase.from('master_categories').select('*').in('type', ['purchase', 'expense']).order('name'),
      supabase.from('expense_items').select('*').order('name'),
      supabase.from('operational_expenses').select('*, master_categories(name, color), expense_items(name)').order('expense_date', { ascending: false }),
      supabase.from('purchases').select('*, products(name, unit), suppliers(name), master_categories(name, color), expense_items(name)').order('purchase_date', { ascending: false }),
      supabase.from('suppliers').select('id, name').eq('is_active', true).order('name'),
    ]);

    if (catRes.data) setCategories(catRes.data as MasterCategory[]);
    if (itemsRes.data) setSubItems(itemsRes.data);
    if (expRes.data) setExpenses(expRes.data as OperationalExpense[]);
    if (purRes.data) setPurchases(purRes.data as Purchase[]);
    if (suppRes.data) setSuppliers(suppRes.data);
    if (isInitial) setLoading(false);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const cogsCategories = categories.filter(c => c.type === 'purchase');

  const filteredExpenses = expenses.filter(e => {
    if (isTestRecord(e.description) || isTestRecord(e.expense_items?.name)) return false;
    const dateOk = e.expense_date >= dateFilter.start && e.expense_date <= dateFilter.end;
    if (!dateOk) return false;
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (e.master_categories?.name || '').toLowerCase().includes(s) ||
      (e.expense_items?.name || '').toLowerCase().includes(s) ||
      (e.description || '').toLowerCase().includes(s)
    );
  });

  const filteredPurchases = purchases.filter(p => {
    if (isTestRecord(p.notes) || isTestRecord(p.products?.name) || isTestRecord(p.suppliers?.name)) return false;
    const d = p.purchase_date.split('T')[0];
    const dateOk = d >= dateFilter.start && d <= dateFilter.end;
    if (!dateOk) return false;
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (p.master_categories?.name || '').toLowerCase().includes(s) ||
      (p.products?.name || '').toLowerCase().includes(s) ||
      (p.suppliers?.name || '').toLowerCase().includes(s) ||
      (p.notes || '').toLowerCase().includes(s)
    );
  });

  const opexTotal = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const cogsTotal = filteredPurchases.reduce((sum, p) => sum + Number(p.total_cost), 0);

  const opexCategorySummary = expenseCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    color: cat.color,
    total: filteredExpenses.filter(e => e.master_category_id === cat.id).reduce((s, e) => s + Number(e.amount), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const cogsCategorySummary = cogsCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    color: cat.color,
    total: filteredPurchases.filter(p => p.master_category_id === cat.id).reduce((s, p) => s + Number(p.total_cost), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const opexGroups = expenseCategories.map(cat => {
    const catExpenses = filteredExpenses.filter(e => e.master_category_id === cat.id);
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color,
      total: catExpenses.reduce((s, e) => s + Number(e.amount), 0),
      items: catExpenses.map(e => ({
        id: e.id,
        date: e.expense_date,
        subItemName: displayName(e.expense_items?.name, t.cockpitTestRecordLabel),
        amount: Number(e.amount),
        description: displayName(e.description, t.cockpitTestRecordLabel),
        paymentMethod: e.payment_method,
      })),
    };
  }).filter(g => g.items.length > 0).sort((a, b) => b.total - a.total);

  const uncategorizedExpenses = filteredExpenses.filter(e => !e.master_category_id);
  if (uncategorizedExpenses.length > 0) {
    opexGroups.push({
      categoryId: 'uncategorized',
      categoryName: 'Uncategorized',
      categoryColor: '#9CA3AF',
      total: uncategorizedExpenses.reduce((s, e) => s + Number(e.amount), 0),
      items: uncategorizedExpenses.map(e => ({
        id: e.id,
        date: e.expense_date,
        subItemName: displayName(e.expense_items?.name, t.cockpitTestRecordLabel),
        amount: Number(e.amount),
        description: displayName(e.description, t.cockpitTestRecordLabel),
        paymentMethod: e.payment_method,
      })),
    });
  }

  const cogsGroups = cogsCategories.map(cat => {
    const catPurchases = filteredPurchases.filter(p => p.master_category_id === cat.id);
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryColor: cat.color,
      total: catPurchases.reduce((s, p) => s + Number(p.total_cost), 0),
      items: catPurchases.map(p => ({
        id: p.id,
        date: p.purchase_date,
        subItemName: displayName(p.expense_items?.name || p.products?.name, t.cockpitTestRecordLabel),
        amount: Number(p.total_cost),
        description: displayName(p.notes, t.cockpitTestRecordLabel),
        productName: displayName(p.products?.name, t.cockpitTestRecordLabel),
        supplierName: displayName(p.suppliers?.name, t.cockpitTestRecordLabel),
        quantity: p.quantity,
        unitCost: p.unit_cost,
        paymentStatus: p.payment_status,
      })),
    };
  }).filter(g => g.items.length > 0).sort((a, b) => b.total - a.total);

  const uncategorizedPurchases = filteredPurchases.filter(p => !p.master_category_id);
  if (uncategorizedPurchases.length > 0) {
    cogsGroups.push({
      categoryId: 'uncategorized',
      categoryName: 'Uncategorized',
      categoryColor: '#9CA3AF',
      total: uncategorizedPurchases.reduce((s, p) => s + Number(p.total_cost), 0),
      items: uncategorizedPurchases.map(p => ({
        id: p.id,
        date: p.purchase_date,
        subItemName: displayName(p.expense_items?.name || p.products?.name, t.cockpitTestRecordLabel),
        amount: Number(p.total_cost),
        description: displayName(p.notes, t.cockpitTestRecordLabel),
        productName: displayName(p.products?.name, t.cockpitTestRecordLabel),
        supplierName: displayName(p.suppliers?.name, t.cockpitTestRecordLabel),
        quantity: p.quantity,
        unitCost: p.unit_cost,
        paymentStatus: p.payment_status,
      })),
    });
  }

  const handleEditExpense = (id: string) => {
    const exp = expenses.find(e => e.id === id);
    if (exp) {
      setExpenseFormError(null);
      setEditingExpense(exp);
      setExpenseFormData({
        master_category_id: exp.master_category_id || '',
        expense_item_id: exp.expense_item_id || '',
        amount: exp.amount,
        expense_date: exp.expense_date.split('T')[0],
        payment_method: exp.payment_method || '',
        description: exp.description || '',
      });
      setShowExpenseForm(true);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);

    const result = await adminDelete('operational_expenses', id);
    setDeletingId(null);

    if (!result.ok) {
      flashError(result.error ?? t.errorOccurred);
      return;
    }

    await loadAllData();
    flashSuccess(t.deletedSuccessfully);
  };

  const handleEditPurchase = (id: string) => {
    const pur = purchases.find(p => p.id === id);
    if (pur) {
      setPurchaseFormError(null);
      setEditingPurchase(pur);
      setPurchaseFormData({
        expense_item_id: pur.expense_item_id || '',
        master_category_id: pur.master_category_id || '',
        supplier_id: pur.supplier_id || '',
        quantity: pur.quantity,
        unit_cost: pur.unit_cost,
        purchase_date: new Date(pur.purchase_date).toISOString().split('T')[0],
        is_on_credit: isOnCreditFromPurchase(pur),
        notes: pur.notes || '',
      });
      setShowPurchaseForm(true);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    if (deletingId) return;
    const purchase = purchases.find(p => p.id === id);
    setDeletingId(id);

    const result = await adminDelete('purchases', id);
    if (!result.ok) {
      setDeletingId(null);
      flashError(result.error ?? t.errorOccurred);
      return;
    }

    await reconcileProductStock(purchase?.product_id, -(Number(purchase?.quantity) || 0));
    setDeletingId(null);
    await loadAllData();
    flashSuccess(t.deletedSuccessfully);
  };

  const [expenseFormData, setExpenseFormData] = useState({
    master_category_id: '',
    expense_item_id: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    description: '',
  });

  const [purchaseFormData, setPurchaseFormData] = useState({
    expense_item_id: '',
    master_category_id: '',
    supplier_id: '',
    quantity: 1,
    unit_cost: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    is_on_credit: true,
    notes: '',
  });

  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [itemSearchText, setItemSearchText] = useState('');
  const itemDropdownRef = useRef<HTMLDivElement>(null);

  const [isCogsItemDropdownOpen, setIsCogsItemDropdownOpen] = useState(false);
  const [cogsItemSearchText, setCogsItemSearchText] = useState('');
  const cogsItemDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target as Node)) {
        setIsItemDropdownOpen(false);
        setItemSearchText('');
      }
      if (cogsItemDropdownRef.current && !cogsItemDropdownRef.current.contains(event.target as Node)) {
        setIsCogsItemDropdownOpen(false);
        setCogsItemSearchText('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const expenseCatSubItems = subItems.filter(si => {
    const cat = categories.find(c => c.id === si.master_category_id);
    return cat?.type === 'expense';
  });

  const cogsCatSubItems = subItems.filter(si => {
    const cat = categories.find(c => c.id === si.master_category_id);
    return cat?.type === 'purchase';
  });

  const filteredDropdownItems = expenseCatSubItems.filter(item => {
    if (!itemSearchText) return true;
    const cat = categories.find(c => c.id === item.master_category_id);
    return (
      item.name.toLowerCase().includes(itemSearchText.toLowerCase()) ||
      (cat?.name || '').toLowerCase().includes(itemSearchText.toLowerCase())
    );
  });

  const filteredCogsDropdownItems = cogsCatSubItems.filter(item => {
    if (!cogsItemSearchText) return true;
    const cat = categories.find(c => c.id === item.master_category_id);
    return (
      item.name.toLowerCase().includes(cogsItemSearchText.toLowerCase()) ||
      (cat?.name || '').toLowerCase().includes(cogsItemSearchText.toLowerCase())
    );
  });

  const purchasePriceSuggestions = useMemo<PurchasePriceSuggestion[]>(() => {
    if (!purchaseFormData.expense_item_id) return [];

    const filtered = purchases
      .filter((purchase) =>
        purchase.expense_item_id === purchaseFormData.expense_item_id &&
        Number(purchase.unit_cost) > 0
      )
      .sort((a, b) => b.purchase_date.localeCompare(a.purchase_date));

    const seen = new Set<string>();
    const unique: PurchasePriceSuggestion[] = [];
    for (const purchase of filtered) {
      const unitCost = Number(purchase.unit_cost);
      const supplierId = purchase.supplier_id || null;
      const key = `${unitCost.toFixed(2)}::${supplierId || 'no-supplier'}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push({
        unit_cost: unitCost,
        supplier_id: supplierId,
        supplier_name: purchase.suppliers?.name || t.noSupplier,
        purchase_date: purchase.purchase_date.split('T')[0],
      });
      if (unique.length >= 5) break;
    }
    return unique;
  }, [purchaseFormData.expense_item_id, purchases, t.noSupplier]);

  const handleSelectExpenseItem = (itemId: string) => {
    const item = subItems.find(i => i.id === itemId);
    if (item) {
      setExpenseFormData(prev => ({
        ...prev,
        expense_item_id: itemId,
        master_category_id: item.master_category_id,
      }));
    }
    setIsItemDropdownOpen(false);
    setItemSearchText('');
  };

  const handleSelectCogsItem = (itemId: string) => {
    const item = subItems.find(i => i.id === itemId);
    if (item) {
      setPurchaseFormData(prev => ({
        ...prev,
        expense_item_id: itemId,
        master_category_id: item.master_category_id,
      }));
    }
    setIsCogsItemDropdownOpen(false);
    setCogsItemSearchText('');
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingExpense) return;

    if (Number(expenseFormData.amount) <= 0) {
      setExpenseFormError(t.amountMustBePositive);
      return;
    }

    setSavingExpense(true);
    setExpenseFormError(null);

    const payload = {
      master_category_id: expenseFormData.master_category_id || null,
      expense_item_id: expenseFormData.expense_item_id || null,
      amount: expenseFormData.amount,
      expense_date: expenseFormData.expense_date,
      payment_method: expenseFormData.payment_method,
      description: expenseFormData.description,
    };

    const result = editingExpense
      ? await adminUpdate('operational_expenses', editingExpense.id, payload)
      : await adminInsert('operational_expenses', payload);

    setSavingExpense(false);

    if (!result.ok) {
      setExpenseFormError(result.error ?? t.errorOccurred);
      return;
    }

    resetExpenseForm();
    await loadAllData();
    flashSuccess(t.savedSuccessfully);
  };

  const reconcileProductStock = async (productId: string | null | undefined, deltaQuantity: number) => {
    if (!productId || !deltaQuantity) return;

    const { data: product, error } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', productId)
      .single();

    if (error || !product) return;

    await adminUpdate('products', productId, {
      quantity: Number(product.quantity || 0) + deltaQuantity,
    });
  };

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingPurchase) return;

    if (!purchaseFormData.expense_item_id) {
      setPurchaseFormError(t.selectExpenseItem);
      return;
    }
    if (Number(purchaseFormData.quantity) <= 0) {
      setPurchaseFormError(t.quantityMustBePositive);
      return;
    }
    if (Number(purchaseFormData.unit_cost) < 0) {
      setPurchaseFormError(t.amountMustBePositive);
      return;
    }

    setSavingPurchase(true);
    setPurchaseFormError(null);

    const total_cost = purchaseFormData.quantity * purchaseFormData.unit_cost;
    const payload = {
      expense_item_id: purchaseFormData.expense_item_id || null,
      master_category_id: purchaseFormData.master_category_id || null,
      supplier_id: purchaseFormData.supplier_id || null,
      quantity: purchaseFormData.quantity,
      unit_cost: purchaseFormData.unit_cost,
      total_cost,
      purchase_date: purchaseFormData.purchase_date,
      notes: purchaseFormData.notes,
      ...purchaseCreditFields(purchaseFormData.is_on_credit),
    };

    if (editingPurchase) {
      const oldProductId = editingPurchase.product_id || null;
      const oldQuantity = Number(editingPurchase.quantity) || 0;
      const newQuantity = Number(purchaseFormData.quantity) || 0;

      const result = await adminUpdate('purchases', editingPurchase.id, payload);
      if (!result.ok) {
        setSavingPurchase(false);
        setPurchaseFormError(result.error ?? t.errorOccurred);
        return;
      }
      await reconcileProductStock(oldProductId, newQuantity - oldQuantity);
    } else {
      const result = await adminInsert('purchases', payload);
      if (!result.ok) {
        setSavingPurchase(false);
        setPurchaseFormError(result.error ?? t.errorOccurred);
        return;
      }
    }

    setSavingPurchase(false);
    resetPurchaseForm();
    await loadAllData();
    flashSuccess(t.savedSuccessfully);
  };

  const openExpenseForm = () => {
    setExpenseFormError(null);
    resetExpenseForm();
    setShowExpenseForm(true);
  };

  const openPurchaseForm = () => {
    setPurchaseFormError(null);
    resetPurchaseForm();
    setShowPurchaseForm(true);
  };

  const closeExpenseForm = () => {
    if (savingExpense) return;
    resetExpenseForm();
  };

  const closePurchaseForm = () => {
    if (savingPurchase) return;
    resetPurchaseForm();
  };

  const resetExpenseForm = () => {
    setExpenseFormData({
      master_category_id: '',
      expense_item_id: '',
      amount: 0,
      expense_date: toLocalDateInput(new Date()),
      payment_method: '',
      description: '',
    });
    setEditingExpense(null);
    setShowExpenseForm(false);
  };

  const resetPurchaseForm = () => {
    setPurchaseFormData({
      expense_item_id: '',
      master_category_id: '',
      supplier_id: '',
      quantity: 1,
      unit_cost: 0,
      purchase_date: toLocalDateInput(new Date()),
      is_on_credit: true,
      notes: '',
    });
    setEditingPurchase(null);
    setShowPurchaseForm(false);
  };

  const tabs = [
    { id: 'operational' as const, label: t.operationalExpenses, icon: DollarSign, color: 'orange' },
    { id: 'cogs' as const, label: `${t.cogs} (${t.purchases})`, icon: ShoppingCart, color: 'blue' },
    { id: 'categories' as const, label: t.categories, icon: Settings2, color: 'gray' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title={t.expense}
        description={t.trackFixedCosts}
        eyebrow={t.finance}
        icon={DollarSign}
        actions={
          <>
            {activeTab === 'operational' && (
              <button
                onClick={openExpenseForm}
                disabled={savingExpense}
                className="neon-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {t.newExpense}
              </button>
            )}
            {activeTab === 'cogs' && (
              <button
                onClick={openPurchaseForm}
                disabled={savingPurchase}
                className="neon-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {t.newPurchase}
              </button>
            )}
          </>
        }
      />

      <div className="cockpit-panel-solid mb-6 flex gap-1 rounded-xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-slate-700'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden text-xs">
                {tab.id === 'operational' ? 'OpEx' : tab.id === 'cogs' ? 'COGS' : 'Categories'}
              </span>
            </button>
          );
        })}
      </div>

      {activeTab !== 'categories' && (
        <div className="cockpit-panel-solid mb-5 flex flex-col gap-3 p-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="cockpit-input w-full py-2.5 pl-10 pr-4 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker
              startDate={dateFilter.start}
              endDate={dateFilter.end}
              onStartChange={(start) => setDateFilter((prev) => ({ ...prev, start }))}
              onEndChange={(end) => setDateFilter((prev) => ({ ...prev, end }))}
              startLabel={t.startDate}
              endLabel={t.endDate}
            />
          </div>
        </div>
      )}

      {activeTab === 'operational' && (
        <>
          <ExpensesSummaryBar
            categories={opexCategorySummary}
            totalAmount={opexTotal}
            label={t.operationalExpenses}
          />
          {opexGroups.length === 0 ? (
            <div className="text-center py-16">
              <DollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">{t.noExpenses}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.startTrackingExpenses}</p>
              <button
                onClick={openExpenseForm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                {t.createFirstExpense}
              </button>
            </div>
          ) : (
            <CategoryGroupedView
              groups={opexGroups}
              type="operational"
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              deletingId={deletingId}
            />
          )}
        </>
      )}

      {activeTab === 'cogs' && (
        <>
          <ExpensesSummaryBar
            categories={cogsCategorySummary}
            totalAmount={cogsTotal}
            label={t.cogs}
          />
          {cogsGroups.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">{t.noPurchasesYet}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.startTracking}</p>
              <button
                onClick={openPurchaseForm}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                {t.createFirstPurchase}
              </button>
            </div>
          ) : (
            <CategoryGroupedView
              groups={cogsGroups}
              type="cogs"
              onEdit={handleEditPurchase}
              onDelete={handleDeletePurchase}
              deletingId={deletingId}
            />
          )}
        </>
      )}

      {activeTab === 'categories' && (
        <ManageCategoriesTab
          categories={categories}
          subItems={subItems}
          onDataChanged={loadAllData}
        />
      )}

      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingExpense ? t.editExpense : t.newExpense}
              </h2>
              <button onClick={closeExpenseForm} disabled={savingExpense} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitExpense} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-130px)]">
              {expenseFormError ? (
                <div className="cockpit-alert-error text-sm">{expenseFormError}</div>
              ) : null}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.expenseItem}</label>
                <div className="relative" ref={itemDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-left flex items-center justify-between"
                  >
                    {expenseFormData.expense_item_id ? (
                      <span className="flex items-center gap-2 truncate">
                        {subItems.find(i => i.id === expenseFormData.expense_item_id)?.name}
                        {(() => {
                          const cat = categories.find(c => c.id === expenseFormData.master_category_id);
                          return cat ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: cat.color }}>
                              {cat.name}
                            </span>
                          ) : null;
                        })()}
                      </span>
                    ) : (
                      <span className="text-gray-400">{t.searchExpenseItems}</span>
                    )}
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isItemDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isItemDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-hidden">
                      <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={itemSearchText}
                            onChange={(e) => setItemSearchText(e.target.value)}
                            placeholder={t.search}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredDropdownItems.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-center text-gray-500">{t.noItemsFound}</div>
                        ) : (
                          filteredDropdownItems.map((item) => {
                            const cat = categories.find(c => c.id === item.master_category_id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectExpenseItem(item.id)}
                                className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                                  item.id === expenseFormData.expense_item_id ? 'bg-gray-50 dark:bg-gray-700 font-medium' : ''
                                }`}
                              >
                                <span className="truncate text-gray-900 dark:text-white">{item.name}</span>
                                {cat && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium text-white flex-shrink-0" style={{ backgroundColor: cat.color }}>
                                    {cat.name}
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!expenseFormData.expense_item_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.masterCategory}</label>
                  <select
                    value={expenseFormData.master_category_id}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, master_category_id: e.target.value }))}
                    className="cockpit-select"
                  >
                    <option value="">{t.selectCategory}</option>
                    {expenseCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.amountWithCurrency}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={expenseFormData.amount || ''}
                  onChange={(e) => setExpenseFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.dateRequired}</label>
                  <SingleDatePicker
                    value={expenseFormData.expense_date}
                    onChange={(date) => setExpenseFormData(prev => ({ ...prev, expense_date: date }))}
                    placeholder={t.date}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.paymentMethod}</label>
                  <input
                    type="text"
                    value={expenseFormData.payment_method}
                    onChange={(e) => setExpenseFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                    placeholder={t.paymentMethodExample}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.description}</label>
                <textarea
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
                  placeholder={t.describeExpense}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingExpense ? t.saving : editingExpense ? t.updateExpense : t.createExpense}
                </button>
                <button
                  type="button"
                  onClick={closeExpenseForm}
                  disabled={savingExpense}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPurchaseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingPurchase ? t.editPurchase : t.newPurchase}
              </h2>
              <button onClick={closePurchaseForm} disabled={savingPurchase} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitPurchase} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-130px)]">
              {purchaseFormError ? (
                <div className="cockpit-alert-error text-sm">{purchaseFormError}</div>
              ) : null}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.expenseItem} *</label>
                <div className="relative" ref={cogsItemDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCogsItemDropdownOpen(!isCogsItemDropdownOpen)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-left flex items-center justify-between"
                  >
                    {purchaseFormData.expense_item_id ? (
                      <span className="flex items-center gap-2 truncate">
                        {subItems.find(i => i.id === purchaseFormData.expense_item_id)?.name}
                        {(() => {
                          const cat = categories.find(c => c.id === purchaseFormData.master_category_id);
                          return cat ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: cat.color }}>
                              {cat.name}
                            </span>
                          ) : null;
                        })()}
                      </span>
                    ) : (
                      <span className="text-gray-400">{t.searchItems}</span>
                    )}
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isCogsItemDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCogsItemDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-hidden">
                      <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={cogsItemSearchText}
                            onChange={(e) => setCogsItemSearchText(e.target.value)}
                            placeholder={t.search}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCogsDropdownItems.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-center text-gray-500">{t.noItemsFound}</div>
                        ) : (
                          filteredCogsDropdownItems.map((item) => {
                            const cat = categories.find(c => c.id === item.master_category_id);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectCogsItem(item.id)}
                                className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                                  item.id === purchaseFormData.expense_item_id ? 'bg-gray-50 dark:bg-gray-700 font-medium' : ''
                                }`}
                              >
                                <span className="truncate text-gray-900 dark:text-white">{item.name}</span>
                                {cat && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium text-white flex-shrink-0" style={{ backgroundColor: cat.color }}>
                                    {cat.name}
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.supplier}</label>
                <select
                  value={purchaseFormData.supplier_id}
                  onChange={(e) => setPurchaseFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
                  className="cockpit-select"
                >
                  <option value="">{t.selectSupplier}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {purchaseFormData.expense_item_id && purchasePriceSuggestions.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {t.pastPurchases}
                  </p>
                  <div className="space-y-2">
                    {purchasePriceSuggestions.map((entry) => (
                      <div
                        key={`${entry.unit_cost}-${entry.supplier_id ?? 'none'}-${entry.purchase_date}`}
                        className="flex items-center justify-between gap-3 rounded-md bg-gray-50 dark:bg-gray-700/40 px-2.5 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            ₼{entry.unit_cost.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {entry.supplier_name} • {entry.purchase_date}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setPurchaseFormData((prev) => ({
                              ...prev,
                              unit_cost: entry.unit_cost,
                              supplier_id: entry.supplier_id || prev.supplier_id,
                            }))
                          }
                          className="shrink-0 rounded-md border border-gray-300 dark:border-gray-600 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                        >
                          {t.useThis}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.quantity} *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={purchaseFormData.quantity || ''}
                    onChange={(e) => setPurchaseFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    required
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.cost}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchaseFormData.unit_cost || ''}
                    onChange={(e) => setPurchaseFormData(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                    required
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {purchaseFormData.quantity > 0 && purchaseFormData.unit_cost > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t.totalCost}: <span className="font-bold text-lg">₼{(purchaseFormData.quantity * purchaseFormData.unit_cost).toFixed(2)}</span>
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.purchaseDate} *</label>
                  <SingleDatePicker
                    value={purchaseFormData.purchase_date}
                    onChange={(date) => setPurchaseFormData(prev => ({ ...prev, purchase_date: date }))}
                    placeholder={t.purchaseDate}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.purchasePaymentMode}</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPurchaseFormData((prev) => ({ ...prev, is_on_credit: true }))}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                        purchaseFormData.is_on_credit
                          ? 'border-cockpit-500 bg-cockpit-500/20 text-white'
                          : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {t.purchaseOnAccount}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurchaseFormData((prev) => ({ ...prev, is_on_credit: false }))}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ${
                        !purchaseFormData.is_on_credit
                          ? 'border-cockpit-500 bg-cockpit-500/20 text-white'
                          : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {t.purchasePaidNow}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.notes}</label>
                <textarea
                  value={purchaseFormData.notes}
                  onChange={(e) => setPurchaseFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
                  placeholder={t.additionalNotes}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingPurchase}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingPurchase ? t.saving : editingPurchase ? t.updatePurchase : t.createPurchase}
                </button>
                <button
                  type="button"
                  onClick={closePurchaseForm}
                  disabled={savingPurchase}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
