import { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Tag, ShoppingCart, DollarSign, Check } from 'lucide-react';
import { adminDelete, adminInsert, adminUpdate } from '../../lib/adminApi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DangerConfirmRow } from '../../components/ui/DangerConfirmRow';
import { IconActionButton } from '../../components/ui/IconActionButton';

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

interface ManageCategoriesTabProps {
  categories: MasterCategory[];
  subItems: SubItem[];
  onDataChanged: () => void;
}

export function ManageCategoriesTab({ categories, subItems, onDataChanged }: ManageCategoriesTabProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubItemForm, setShowSubItemForm] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<MasterCategory | null>(null);
  const [editingSubItem, setEditingSubItem] = useState<SubItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'category' | 'subitem'; id: string } | null>(null);
  const [activePanel, setActivePanel] = useState<'purchase' | 'expense'>('purchase');

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    type: 'purchase' as 'expense' | 'purchase',
    color: '#3B82F6',
  });

  const [subItemForm, setSubItemForm] = useState({ name: '' });
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingSubItem, setSavingSubItem] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [subItemFormError, setSubItemFormError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const flashSuccess = () => {
    setActionError(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const flashError = (message: string) => {
    setActionError(message);
    setShowSuccess(false);
  };

  const purchaseCategories = categories.filter(c => c.type === 'purchase');
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const currentCategories = activePanel === 'purchase' ? purchaseCategories : expenseCategories;
  const totalSubItems = currentCategories.reduce(
    (sum, cat) => sum + subItems.filter(si => si.master_category_id === cat.id).length,
    0,
  );

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim() || savingCategory) return;

    setSavingCategory(true);
    setCategoryFormError(null);

    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim(),
      type: categoryForm.type,
      color: categoryForm.color,
      icon: 'circle',
    };

    const result = editingCategory
      ? await adminUpdate('master_categories', editingCategory.id, payload)
      : await adminInsert('master_categories', payload);

    setSavingCategory(false);

    if (!result.ok) {
      setCategoryFormError(result.error ?? 'Mutation failed');
      return;
    }

    setCategoryForm({ name: '', description: '', type: activePanel, color: '#3B82F6' });
    setShowCategoryForm(false);
    setEditingCategory(null);
    onDataChanged();
    flashSuccess();
  };

  const handleCreateSubItem = async (categoryId: string) => {
    if (!subItemForm.name.trim() || !user || savingSubItem) return;

    setSavingSubItem(true);
    setSubItemFormError(null);

    const result = editingSubItem
      ? await adminUpdate('expense_items', editingSubItem.id, { name: subItemForm.name.trim() })
      : await adminInsert('expense_items', {
          name: subItemForm.name.trim(),
          master_category_id: categoryId,
          user_id: user.id,
        });

    setSavingSubItem(false);

    if (!result.ok) {
      setSubItemFormError(result.error ?? 'Mutation failed');
      return;
    }

    setSubItemForm({ name: '' });
    setShowSubItemForm(null);
    setEditingSubItem(null);
    onDataChanged();
    flashSuccess();
  };

  const handleDeleteCategory = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    setActionError(null);

    const catSubItems = subItems.filter((si) => si.master_category_id === id);
    const itemIds = catSubItems.map((si) => si.id);

    const [opexByCat, purByCat, opexByItem, purByItem] = await Promise.all([
      supabase
        .from('operational_expenses')
        .select('id', { count: 'exact', head: true })
        .eq('master_category_id', id),
      supabase
        .from('purchases')
        .select('id', { count: 'exact', head: true })
        .eq('master_category_id', id),
      itemIds.length > 0
        ? supabase
            .from('operational_expenses')
            .select('id', { count: 'exact', head: true })
            .in('expense_item_id', itemIds)
        : Promise.resolve({ count: 0, error: null }),
      itemIds.length > 0
        ? supabase
            .from('purchases')
            .select('id', { count: 'exact', head: true })
            .in('expense_item_id', itemIds)
        : Promise.resolve({ count: 0, error: null }),
    ]);

    if (opexByCat.error || purByCat.error || opexByItem.error || purByItem.error) {
      setDeletingId(null);
      setDeleteConfirm(null);
      flashError(
        opexByCat.error?.message ??
          purByCat.error?.message ??
          opexByItem.error?.message ??
          purByItem.error?.message ??
          t.errorOccurred,
      );
      return;
    }

    const usedCount =
      (opexByCat.count ?? 0) +
      (purByCat.count ?? 0) +
      (opexByItem.count ?? 0) +
      (purByItem.count ?? 0);

    if (usedCount > 0) {
      setDeletingId(null);
      setDeleteConfirm(null);
      flashError(t.categoryInUseCannotDelete.replace('{count}', String(usedCount)));
      return;
    }

    for (const item of catSubItems) {
      const itemResult = await adminDelete('expense_items', item.id);
      if (!itemResult.ok) {
        setDeletingId(null);
        setDeleteConfirm(null);
        flashError(itemResult.error ?? t.errorOccurred);
        return;
      }
    }

    const result = await adminDelete('master_categories', id);
    setDeletingId(null);

    if (!result.ok) {
      setDeleteConfirm(null);
      flashError(result.error ?? t.errorOccurred);
      return;
    }

    setDeleteConfirm(null);
    onDataChanged();
    flashSuccess();
  };

  const handleDeleteSubItem = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    setActionError(null);

    const [opexRes, purRes] = await Promise.all([
      supabase
        .from('operational_expenses')
        .select('id', { count: 'exact', head: true })
        .eq('expense_item_id', id),
      supabase
        .from('purchases')
        .select('id', { count: 'exact', head: true })
        .eq('expense_item_id', id),
    ]);

    if (opexRes.error || purRes.error) {
      setDeletingId(null);
      setDeleteConfirm(null);
      flashError(opexRes.error?.message ?? purRes.error?.message ?? t.errorOccurred);
      return;
    }

    const usedCount = (opexRes.count ?? 0) + (purRes.count ?? 0);
    if (usedCount > 0) {
      setDeletingId(null);
      setDeleteConfirm(null);
      flashError(t.expenseItemInUseCannotDelete.replace('{count}', String(usedCount)));
      return;
    }

    const result = await adminDelete('expense_items', id);
    setDeletingId(null);

    if (!result.ok) {
      setDeleteConfirm(null);
      flashError(result.error ?? t.errorOccurred);
      return;
    }

    setDeleteConfirm(null);
    onDataChanged();
    flashSuccess();
  };

  const openCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      type: activePanel,
      color: activePanel === 'purchase' ? '#3B82F6' : '#F97316',
    });
    setEditingCategory(null);
    setCategoryFormError(null);
    setShowCategoryForm(true);
  };

  const closeCategoryForm = () => {
    if (savingCategory) return;
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryFormError(null);
  };

  const startEditCategory = (cat: MasterCategory) => {
    setEditingCategory(cat);
    setCategoryFormError(null);
    setCategoryForm({
      name: cat.name,
      description: cat.description || '',
      type: cat.type,
      color: cat.color,
    });
    setShowCategoryForm(true);
  };

  const startEditSubItem = (item: SubItem) => {
    setEditingSubItem(item);
    setSubItemFormError(null);
    setSubItemForm({ name: item.name });
    setShowSubItemForm(item.master_category_id);
  };

  return (
    <div>
      {actionError ? (
        <div className="cockpit-alert-error mb-4 text-sm">{actionError}</div>
      ) : null}

      {showSuccess ? (
        <div className="cockpit-alert-success mb-4 animate-scaleIn">
          <Check className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-200" />
          <span>{t.savedSuccessfully}</span>
        </div>
      ) : null}

      <div className="cockpit-panel-solid mb-5 p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setActivePanel('purchase')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activePanel === 'purchase'
              ? 'bg-violet-600 text-white shadow-neon-soft'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          {t.cogsCategories}
          <span className="rounded-md bg-black/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/90 dark:bg-white/10 dark:text-slate-200">
            {purchaseCategories.length}
          </span>
        </button>
        <button
          onClick={() => setActivePanel('expense')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activePanel === 'expense'
              ? 'bg-violet-600 text-white shadow-neon-soft'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          {t.fixedCostCategories}
          <span className="rounded-md bg-black/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/90 dark:bg-white/10 dark:text-slate-200">
            {expenseCategories.length}
          </span>
        </button>
        <div className="ml-auto">
          <button
            onClick={openCategoryForm}
            disabled={savingCategory}
            className="neon-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t.addCategory}
          </button>
        </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-[340px]">
          <div className="rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2 dark:border-violet-500/20 dark:bg-slate-900/50">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{t.categories}</p>
            <p className="mt-1 font-mono text-lg font-semibold text-slate-900 dark:text-white">{currentCategories.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2 dark:border-violet-500/20 dark:bg-slate-900/50">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{t.items}</p>
            <p className="mt-1 font-mono text-lg font-semibold text-slate-900 dark:text-white">{totalSubItems}</p>
          </div>
        </div>
      </div>

      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCategory ? t.edit : t.addCategory}
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryForm(prev => ({ ...prev, type: 'purchase' }))}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    categoryForm.type === 'purchase'
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {t.cogs}
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryForm(prev => ({ ...prev, type: 'expense' }))}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    categoryForm.type === 'expense'
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {t.operationalExpenses}
                </button>
              </div>
              {categoryFormError ? (
                <div className="cockpit-alert-error text-sm">{categoryFormError}</div>
              ) : null}
              <input
                type="text"
                placeholder={`${t.categoryName} *`}
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                className="cockpit-input w-full"
                autoFocus
                disabled={savingCategory}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleCreateCategory();
                  }
                }}
              />
              <input
                type="text"
                placeholder={t.descriptionOptional}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                className="cockpit-input w-full"
                disabled={savingCategory}
              />
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t.color}</label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={savingCategory}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => void handleCreateCategory()}
                  disabled={!categoryForm.name.trim() || savingCategory}
                  className="neon-btn-primary flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingCategory ? t.saving : editingCategory ? t.update : t.create}
                </button>
                <button
                  type="button"
                  onClick={closeCategoryForm}
                  disabled={savingCategory}
                  className="neon-btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentCategories.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
            {activePanel === 'purchase' ? t.noCOGSCategories : t.noFixedCostCategories}
          </p>
          <button
            onClick={openCategoryForm}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t.createFirstOne}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {currentCategories.map((cat) => {
            const catSubItems = subItems.filter(si => si.master_category_id === cat.id);
            const isExpanded = expandedCategories.has(cat.id);

            return (
              <div key={cat.id} className="cockpit-panel-solid overflow-hidden">
                {deleteConfirm?.type === 'category' && deleteConfirm.id === cat.id ? (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20">
                    <DangerConfirmRow
                      message={t.deleteCategoryAndItemsConfirm.replace('{name}', cat.name)}
                      onConfirm={() => void handleDeleteCategory(cat.id)}
                      onCancel={() => { if (deletingId !== cat.id) setDeleteConfirm(null); }}
                      confirmDisabled={deletingId === cat.id}
                      confirmLabel={deletingId === cat.id ? t.saving : undefined}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <button onClick={() => toggleCategory(cat.id)} className="flex flex-1 items-center gap-3">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: cat.color }}>
                          {cat.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{cat.name}</span>
                          {cat.description && <p className="text-xs text-slate-500 dark:text-slate-400">{cat.description}</p>}
                        </div>
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {catSubItems.length} {t.items}
                        </span>
                      </button>
                      <div className="flex items-center gap-1">
                        <IconActionButton
                          onClick={() => {
                            setShowSubItemForm(cat.id);
                            setEditingSubItem(null);
                            setSubItemForm({ name: '' });
                            setSubItemFormError(null);
                          }}
                          icon={<Plus className="h-4 w-4" />}
                          tone="success"
                          title={t.addExpenseItem}
                        />
                        <IconActionButton
                          onClick={() => startEditCategory(cat)}
                          icon={<Edit2 className="h-3.5 w-3.5" />}
                          tone="edit"
                          label={t.edit}
                        />
                        <IconActionButton
                          onClick={() => setDeleteConfirm({ type: 'category', id: cat.id })}
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          tone="danger"
                          label={t.delete}
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/30">
                        {showSubItemForm === cat.id && (
                          <div className="border-b border-slate-100 bg-violet-50/40 px-4 py-3 dark:border-slate-700 dark:bg-violet-500/10">
                            {subItemFormError ? (
                              <div className="cockpit-alert-error mb-2 text-sm">{subItemFormError}</div>
                            ) : null}
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder={t.expenseItemName}
                                value={subItemForm.name}
                                onChange={(e) => setSubItemForm({ name: e.target.value })}
                                className="cockpit-input flex-1"
                                autoFocus
                                disabled={savingSubItem}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    void handleCreateSubItem(cat.id);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => void handleCreateSubItem(cat.id)}
                                disabled={!subItemForm.name.trim() || savingSubItem}
                                className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                {savingSubItem ? t.saving : editingSubItem ? t.update : t.add}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (savingSubItem) return;
                                  setShowSubItemForm(null);
                                  setEditingSubItem(null);
                                  setSubItemFormError(null);
                                }}
                                disabled={savingSubItem}
                                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200"
                              >
                                {t.cancel}
                              </button>
                            </div>
                          </div>
                        )}

                        {catSubItems.length === 0 && showSubItemForm !== cat.id ? (
                          <div className="px-4 py-4 text-center">
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{t.noExpenseItems}</p>
                            <button
                              onClick={() => { setShowSubItemForm(cat.id); setSubItemForm({ name: '' }); }}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {t.createFirstExpenseItem}
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {catSubItems.map((si) => (
                              <div key={si.id} className="flex items-center justify-between px-4 py-2.5 pl-14">
                                {deleteConfirm?.type === 'subitem' && deleteConfirm.id === si.id ? (
                                  <div className="flex-1 flex items-center justify-between">
                                    <DangerConfirmRow
                                      message={t.deleteExpenseItemConfirm.replace('{name}', si.name)}
                                      onConfirm={() => void handleDeleteSubItem(si.id)}
                                      onCancel={() => { if (deletingId !== si.id) setDeleteConfirm(null); }}
                                      confirmDisabled={deletingId === si.id}
                                      confirmLabel={deletingId === si.id ? t.saving : undefined}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{si.name}</span>
                                    <div className="flex items-center gap-1">
                                      <IconActionButton
                                        onClick={() => startEditSubItem(si)}
                                        icon={<Edit2 className="h-3 w-3" />}
                                        tone="edit"
                                        label={t.edit}
                                        className="h-7 w-7"
                                      />
                                      <IconActionButton
                                        onClick={() => setDeleteConfirm({ type: 'subitem', id: si.id })}
                                        icon={<Trash2 className="h-3 w-3" />}
                                        tone="danger"
                                        label={t.delete}
                                        className="h-7 w-7"
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
