import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, Loader2, GripVertical, Check, Package } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, ModifierGroup, ModifierOption } from '../lib/supabase';
import { adminDelete, adminInsert, adminUpdate } from '../lib/adminApi';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Modal } from './ui/Modal';
import { SkeletonTable } from './ui/Skeleton';

interface ModifierLibraryProps {
  onClose: () => void;
}

interface GroupForm {
  name: string;
  min_select: number;
  max_select: number;
  is_required: boolean;
}

interface OptionForm {
  name: string;
  price_adjustment: string;
  image_url: string;
  is_default: boolean;
  is_available: boolean;
}

const emptyGroupForm: GroupForm = { name: '', min_select: 0, max_select: 1, is_required: false };
const emptyOptionForm: OptionForm = { name: '', price_adjustment: '0', image_url: '', is_default: false, is_available: true };

export function ModifierLibrary({ onClose }: ModifierLibraryProps) {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<(ModifierGroup & { product_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState<GroupForm>(emptyGroupForm);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [optionForm, setOptionForm] = useState<OptionForm>(emptyOptionForm);
  const [showOptionFormFor, setShowOptionFormFor] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('modifier_groups')
      .select('*, modifier_options(*), product_modifier_groups(id, product_id)')
      .order('display_order')
      .order('created_at');
    if (data) {
      const enriched = data.map(g => ({
        ...g,
        product_count: g.product_modifier_groups?.length || 0,
      }));
      setGroups(enriched as (ModifierGroup & { product_count?: number })[]);
      if (enriched.length > 0 && expandedGroups.size === 0) {
        setExpandedGroups(new Set(enriched.map(g => g.id)));
      }
    }
    setLoading(false);
  };

  const toggleExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) return;
    setSaving(true);

    const data = {
      name: groupForm.name.trim(),
      min_select: groupForm.min_select,
      max_select: groupForm.max_select,
      is_required: groupForm.is_required,
    };

    if (editingGroupId) {
      await adminUpdate('modifier_groups', editingGroupId, data);
    } else {
      const maxOrder = groups.reduce((max, g) => Math.max(max, g.display_order || 0), 0);
      await adminInsert('modifier_groups', {
        ...data,
        display_order: maxOrder + 1,
      });
    }

    setShowGroupForm(false);
    setEditingGroupId(null);
    setGroupForm(emptyGroupForm);
    setSaving(false);
    loadGroups();
  };

  const handleDeleteGroup = async (groupId: string) => {
    await adminDelete('modifier_groups', groupId);
    loadGroups();
  };

  const handleMoveGroup = async (groupId: string, direction: 'up' | 'down') => {
    const sorted = [...groups].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const idx = sorted.findIndex(g => g.id === groupId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    await Promise.all([
      adminUpdate('modifier_groups', sorted[idx].id, { display_order: sorted[swapIdx].display_order }),
      adminUpdate('modifier_groups', sorted[swapIdx].id, { display_order: sorted[idx].display_order }),
    ]);
    loadGroups();
  };

  const startEditGroup = (group: ModifierGroup) => {
    setEditingGroupId(group.id);
    setGroupForm({
      name: group.name,
      min_select: group.min_select,
      max_select: group.max_select,
      is_required: group.is_required,
    });
    setShowGroupForm(true);
  };

  const handleSaveOption = async (groupId: string) => {
    if (!optionForm.name.trim()) return;
    setSaving(true);

    const data = {
      name: optionForm.name.trim(),
      price_adjustment: parseFloat(optionForm.price_adjustment) || 0,
      image_url: optionForm.image_url.trim() || null,
      is_default: optionForm.is_default,
      is_available: optionForm.is_available,
    };

    if (editingOptionId) {
      await adminUpdate('modifier_options', editingOptionId, data);
    } else {
      const group = groups.find(g => g.id === groupId);
      const maxOrder = group?.modifier_options?.reduce((max, o) => Math.max(max, o.display_order || 0), 0) || 0;
      await adminInsert('modifier_options', {
        ...data,
        modifier_group_id: groupId,
        display_order: maxOrder + 1,
      });
    }

    setShowOptionFormFor(null);
    setEditingOptionId(null);
    setOptionForm(emptyOptionForm);
    setSaving(false);
    loadGroups();
  };

  const handleDeleteOption = async (optionId: string) => {
    await adminDelete('modifier_options', optionId);
    loadGroups();
  };

  const startEditOption = (option: ModifierOption, groupId: string) => {
    setEditingOptionId(option.id);
    setOptionForm({
      name: option.name,
      price_adjustment: option.price_adjustment.toString(),
      image_url: option.image_url || '',
      is_default: option.is_default,
      is_available: option.is_available,
    });
    setShowOptionFormFor(groupId);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return t.freeOption;
    return price > 0 ? `+₼${price.toFixed(2)}` : `-₼${Math.abs(price).toFixed(2)}`;
  };

  return (
    <>
    <Modal
      open
      onClose={onClose}
      titleId="modifier-library-title"
      title={t.modifierLibrary}
      subtitle={`${groups.length} ${t.modifierGroups.toLowerCase()}`}
      widthClassName="max-w-2xl"
    >
          {loading ? (
            <SkeletonTable rows={4} />
          ) : (
            <div className="space-y-4">
              {groups
                .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                .map((group, gIdx) => {
                  const isExpanded = expandedGroups.has(group.id);
                  const options = (group.modifier_options || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                  return (
                    <div key={group.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      <div
                        className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer"
                        onClick={() => toggleExpand(group.id)}
                      >
                        <div className="flex flex-col gap-0.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleMoveGroup(group.id, 'up')}
                            disabled={gIdx === 0}
                            className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveGroup(group.id, 'down')}
                            disabled={gIdx === groups.length - 1}
                            className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{group.name}</span>
                            {group.is_required && (
                              <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                                {t.required}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {group.min_select === 1 && group.max_select === 1
                                ? t.chooseOne
                                : `${t.chooseUpTo} ${group.max_select}`}
                              {' '} / {options.length} {t.items}
                            </p>
                            <span className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {group.product_count || 0} {t.items}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => startEditGroup(group)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteGroupId(group.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>

                      {isExpanded && (
                        <div className="p-4 space-y-2">
                          {options.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">{t.noOptions}</p>
                          ) : (
                            options.map(option => (
                              <div
                                key={option.id}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                  option.is_available
                                    ? 'bg-gray-50 dark:bg-gray-700/30'
                                    : 'bg-gray-50 dark:bg-gray-700/30 opacity-50'
                                }`}
                              >
                                <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                {option.image_url && (
                                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-600">
                                    <img src={option.image_url} alt="" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{option.name}</span>
                                    {option.is_default && (
                                      <span className="text-xs px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded flex items-center gap-0.5">
                                        <Check className="w-3 h-3" />
                                        {t.defaultOption}
                                      </span>
                                    )}
                                    {!option.is_available && (
                                      <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded">
                                        {t.unavailable}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className={`text-sm font-semibold flex-shrink-0 ${
                                  Number(option.price_adjustment) > 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {formatPrice(Number(option.price_adjustment))}
                                </span>
                                <button
                                  onClick={() => startEditOption(option, group.id)}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded flex-shrink-0"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOption(option.id)}
                                  className="p-1 text-red-400 hover:text-red-600 rounded flex-shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}

                          {showOptionFormFor === group.id ? (
                            <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 mt-2 space-y-3 bg-white dark:bg-gray-800">
                              <input
                                type="text"
                                value={optionForm.name}
                                onChange={e => setOptionForm({ ...optionForm, name: e.target.value })}
                                placeholder={t.optionName}
                                className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t.priceAdjustment} (₼)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={optionForm.price_adjustment}
                                    onChange={e => setOptionForm({ ...optionForm, price_adjustment: e.target.value })}
                                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t.productImage}</label>
                                  <input
                                    type="url"
                                    value={optionForm.image_url}
                                    onChange={e => setOptionForm({ ...optionForm, image_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={optionForm.is_default}
                                    onChange={e => setOptionForm({ ...optionForm, is_default: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span className="text-gray-700 dark:text-gray-300">{t.defaultOption}</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={optionForm.is_available}
                                    onChange={e => setOptionForm({ ...optionForm, is_available: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span className="text-gray-700 dark:text-gray-300">{t.available}</span>
                                </label>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setShowOptionFormFor(null); setEditingOptionId(null); setOptionForm(emptyOptionForm); }}
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                                >
                                  {t.cancel}
                                </button>
                                <button
                                  onClick={() => handleSaveOption(group.id)}
                                  disabled={saving || !optionForm.name.trim()}
                                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                >
                                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                  {editingOptionId ? t.save : t.addOption}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setOptionForm(emptyOptionForm);
                                setEditingOptionId(null);
                                setShowOptionFormFor(group.id);
                              }}
                              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg text-sm hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              {t.addOption}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              {groups.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">{t.noModifiers}</p>
                </div>
              )}
            </div>
          )}

        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
          {showGroupForm ? (
            <div className="space-y-3">
              <input
                type="text"
                value={groupForm.name}
                onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                placeholder={t.groupName}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
              />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t.minSelections}</label>
                  <input
                    type="number"
                    min="0"
                    value={groupForm.min_select}
                    onChange={e => setGroupForm({ ...groupForm, min_select: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t.maxSelections}</label>
                  <input
                    type="number"
                    min="1"
                    value={groupForm.max_select}
                    onChange={e => setGroupForm({ ...groupForm, max_select: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={groupForm.is_required}
                      onChange={e => setGroupForm({ ...groupForm, is_required: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{t.required}</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowGroupForm(false); setEditingGroupId(null); setGroupForm(emptyGroupForm); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSaveGroup}
                  disabled={saving || !groupForm.name.trim()}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingGroupId ? t.save : t.addModifierGroup}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setGroupForm(emptyGroupForm); setEditingGroupId(null); setShowGroupForm(true); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t.addModifierGroup}
            </button>
          )}
        </div>
    </Modal>
      <ConfirmDialog
        open={confirmDeleteGroupId !== null}
        title={t.delete}
        message={t.confirmDelete}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onCancel={() => setConfirmDeleteGroupId(null)}
        onConfirm={() => {
          if (!confirmDeleteGroupId) return;
          void handleDeleteGroup(confirmDeleteGroupId);
          setConfirmDeleteGroupId(null);
        }}
      />
    </>
  );
}
