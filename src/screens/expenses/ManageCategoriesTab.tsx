import { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Tag, ShoppingCart, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
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
    if (!categoryForm.name.trim()) return;
    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim(),
      type: categoryForm.type,
      color: categoryForm.color,
      icon: 'circle',
    };

    if (editingCategory) {
      await supabase.from('master_categories').update(payload).eq('id', editingCategory.id);
    } else {
      await supabase.from('master_categories').insert(payload);
    }

    setCategoryForm({ name: '', description: '', type: activePanel, color: '#3B82F6' });
    setShowCategoryForm(false);
    setEditingCategory(null);
    onDataChanged();
  };

  const handleCreateSubItem = async (categoryId: string) => {
    if (!subItemForm.name.trim() || !user) return;
    if (editingSubItem) {
      await supabase.from('expense_items').update({ name: subItemForm.name.trim() }).eq('id', editingSubItem.id);
    } else {
      await supabase.from('expense_items').insert({
        name: subItemForm.name.trim(),
        master_category_id: categoryId,
        user_id: user.id,
      });
    }
    setSubItemForm({ name: '' });
    setShowSubItemForm(null);
    setEditingSubItem(null);
    onDataChanged();
  };

  const handleDeleteCategory = async (id: string) => {
    await supabase.from('master_categories').delete().eq('id', id);
    setDeleteConfirm(null);
    onDataChanged();
  };

  const handleDeleteSubItem = async (id: string) => {
    await supabase.from('expense_items').delete().eq('id', id);
    setDeleteConfirm(null);
    onDataChanged();
  };

  const startEditCategory = (cat: MasterCategory) => {
    setEditingCategory(cat);
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
    setSubItemForm({ name: item.name });
    setShowSubItemForm(item.master_category_id);
  };

  return (
    <div>
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
          COGS Categories
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
          Operational Categories
          <span className="rounded-md bg-black/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/90 dark:bg-white/10 dark:text-slate-200">
            {expenseCategories.length}
          </span>
        </button>
        <div className="ml-auto">
          <button
            onClick={() => {
              setCategoryForm({ name: '', description: '', type: activePanel, color: activePanel === 'purchase' ? '#3B82F6' : '#F97316' });
              setEditingCategory(null);
              setShowCategoryForm(true);
            }}
            className="neon-btn-primary"
          >
            <Plus className="h-4 w-4" />
            New Category
          </button>
        </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:w-[340px]">
          <div className="rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2 dark:border-violet-500/20 dark:bg-slate-900/50">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Categories</p>
            <p className="mt-1 font-mono text-lg font-semibold text-slate-900 dark:text-white">{currentCategories.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2 dark:border-violet-500/20 dark:bg-slate-900/50">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Sub-items</p>
            <p className="mt-1 font-mono text-lg font-semibold text-slate-900 dark:text-white">{totalSubItems}</p>
          </div>
        </div>
      </div>

      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCategory ? 'Edit Category' : 'New Category'}
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
                  COGS
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
                  Operational
                </button>
              </div>
              <input
                type="text"
                placeholder="Category Name *"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                className="cockpit-input w-full"
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                className="cockpit-input w-full"
              />
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Color</label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateCategory}
                  disabled={!categoryForm.name.trim()}
                  className="neon-btn-primary flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }}
                  className="neon-btn-secondary"
                >
                  Cancel
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
            No {activePanel === 'purchase' ? 'COGS' : 'operational'} categories yet
          </p>
          <button
            onClick={() => {
              setCategoryForm({ name: '', description: '', type: activePanel, color: activePanel === 'purchase' ? '#3B82F6' : '#F97316' });
              setShowCategoryForm(true);
            }}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create your first category
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
                      message={`Delete "${cat.name}" and all its sub-items?`}
                      onConfirm={() => handleDeleteCategory(cat.id)}
                      onCancel={() => setDeleteConfirm(null)}
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
                          {catSubItems.length} sub-items
                        </span>
                      </button>
                      <div className="flex items-center gap-1">
                        <IconActionButton
                          onClick={() => { setShowSubItemForm(cat.id); setEditingSubItem(null); setSubItemForm({ name: '' }); }}
                          icon={<Plus className="h-4 w-4" />}
                          tone="success"
                          title="Add sub-item"
                        />
                        <IconActionButton
                          onClick={() => startEditCategory(cat)}
                          icon={<Edit2 className="h-3.5 w-3.5" />}
                          tone="edit"
                          label="Edit category"
                        />
                        <IconActionButton
                          onClick={() => setDeleteConfirm({ type: 'category', id: cat.id })}
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          tone="danger"
                          label="Delete category"
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/30">
                        {showSubItemForm === cat.id && (
                          <div className="border-b border-slate-100 bg-violet-50/40 px-4 py-3 dark:border-slate-700 dark:bg-violet-500/10">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Sub-item name..."
                                value={subItemForm.name}
                                onChange={(e) => setSubItemForm({ name: e.target.value })}
                                className="cockpit-input flex-1"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSubItem(cat.id); }}
                              />
                              <button
                                onClick={() => handleCreateSubItem(cat.id)}
                                disabled={!subItemForm.name.trim()}
                                className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                {editingSubItem ? 'Update' : 'Add'}
                              </button>
                              <button
                                onClick={() => { setShowSubItemForm(null); setEditingSubItem(null); }}
                                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {catSubItems.length === 0 && showSubItemForm !== cat.id ? (
                          <div className="px-4 py-4 text-center">
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">No sub-items yet</p>
                            <button
                              onClick={() => { setShowSubItemForm(cat.id); setSubItemForm({ name: '' }); }}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Add first sub-item
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {catSubItems.map((si) => (
                              <div key={si.id} className="flex items-center justify-between px-4 py-2.5 pl-14">
                                {deleteConfirm?.type === 'subitem' && deleteConfirm.id === si.id ? (
                                  <div className="flex-1 flex items-center justify-between">
                                    <DangerConfirmRow
                                      message={`Delete "${si.name}"?`}
                                      onConfirm={() => handleDeleteSubItem(si.id)}
                                      onCancel={() => setDeleteConfirm(null)}
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
                                        label="Edit sub-item"
                                        className="h-7 w-7"
                                      />
                                      <IconActionButton
                                        onClick={() => setDeleteConfirm({ type: 'subitem', id: si.id })}
                                        icon={<Trash2 className="h-3 w-3" />}
                                        tone="danger"
                                        label="Delete sub-item"
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
