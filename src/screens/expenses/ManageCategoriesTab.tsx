import { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Tag, ShoppingCart, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

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
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setActivePanel('purchase')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activePanel === 'purchase'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          COGS Categories
        </button>
        <button
          onClick={() => setActivePanel('expense')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activePanel === 'expense'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Operational Categories
        </button>
        <div className="ml-auto">
          <button
            onClick={() => {
              setCategoryForm({ name: '', description: '', type: activePanel, color: activePanel === 'purchase' ? '#3B82F6' : '#F97316' });
              setEditingCategory(null);
              setShowCategoryForm(true);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              activePanel === 'purchase' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            New Category
          </button>
        </div>
      </div>

      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                      ? 'bg-blue-600 text-white'
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
                      ? 'bg-orange-600 text-white'
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
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
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
                  className="flex-1 py-2.5 bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => { setShowCategoryForm(false); setEditingCategory(null); }}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
        <div className="space-y-2">
          {currentCategories.map((cat) => {
            const catSubItems = subItems.filter(si => si.master_category_id === cat.id);
            const isExpanded = expandedCategories.has(cat.id);

            return (
              <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {deleteConfirm?.type === 'category' && deleteConfirm.id === cat.id ? (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-800 dark:text-red-200">Delete "{cat.name}" and all its sub-items?</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleDeleteCategory(cat.id)} className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md font-medium">Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md font-medium">Cancel</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-4 py-3">
                      <button onClick={() => toggleCategory(cat.id)} className="flex items-center gap-3 flex-1">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: cat.color }}>
                          {cat.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <span className="font-medium text-sm text-gray-900 dark:text-white">{cat.name}</span>
                          {cat.description && <p className="text-xs text-gray-500 dark:text-gray-400">{cat.description}</p>}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                          {catSubItems.length} sub-items
                        </span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setShowSubItemForm(cat.id); setEditingSubItem(null); setSubItemForm({ name: '' }); }} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors" title="Add sub-item">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={() => startEditCategory(cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm({ type: 'category', id: cat.id })} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                        {showSubItemForm === cat.id && (
                          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Sub-item name..."
                                value={subItemForm.name}
                                onChange={(e) => setSubItemForm({ name: e.target.value })}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSubItem(cat.id); }}
                              />
                              <button
                                onClick={() => handleCreateSubItem(cat.id)}
                                disabled={!subItemForm.name.trim()}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
                              >
                                {editingSubItem ? 'Update' : 'Add'}
                              </button>
                              <button
                                onClick={() => { setShowSubItemForm(null); setEditingSubItem(null); }}
                                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
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
                          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {catSubItems.map((si) => (
                              <div key={si.id} className="flex items-center justify-between px-4 py-2.5 pl-14">
                                {deleteConfirm?.type === 'subitem' && deleteConfirm.id === si.id ? (
                                  <div className="flex-1 flex items-center justify-between">
                                    <span className="text-xs text-red-700 dark:text-red-300">Delete "{si.name}"?</span>
                                    <div className="flex gap-2">
                                      <button onClick={() => handleDeleteSubItem(si.id)} className="px-2.5 py-1 text-xs bg-red-600 text-white rounded font-medium">Delete</button>
                                      <button onClick={() => setDeleteConfirm(null)} className="px-2.5 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded font-medium">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{si.name}</span>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => startEditSubItem(si)} className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button onClick={() => setDeleteConfirm({ type: 'subitem', id: si.id })} className="p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
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
