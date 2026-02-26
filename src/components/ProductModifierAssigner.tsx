import { useState, useEffect } from 'react';
import { X, Loader2, Check, Sliders } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Product, ModifierGroup } from '../lib/supabase';

interface ProductModifierAssignerProps {
  product: Product;
  onClose: () => void;
}

export function ProductModifierAssigner({ product, onClose }: ProductModifierAssignerProps) {
  const { t } = useLanguage();
  const [allGroups, setAllGroups] = useState<ModifierGroup[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [product.id]);

  const loadData = async () => {
    setLoading(true);
    const [groupsRes, assignedRes] = await Promise.all([
      supabase
        .from('modifier_groups')
        .select('*, modifier_options(*)')
        .order('display_order')
        .order('name'),
      supabase
        .from('product_modifier_groups')
        .select('modifier_group_id')
        .eq('product_id', product.id),
    ]);

    if (groupsRes.data) setAllGroups(groupsRes.data as ModifierGroup[]);
    if (assignedRes.data) {
      setAssignedIds(new Set(assignedRes.data.map(r => r.modifier_group_id)));
    }
    setLoading(false);
  };

  const handleToggle = async (groupId: string) => {
    setSaving(true);
    const isAssigned = assignedIds.has(groupId);

    if (isAssigned) {
      await supabase
        .from('product_modifier_groups')
        .delete()
        .eq('product_id', product.id)
        .eq('modifier_group_id', groupId);
      setAssignedIds(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    } else {
      const maxOrder = assignedIds.size;
      await supabase
        .from('product_modifier_groups')
        .insert({
          product_id: product.id,
          modifier_group_id: groupId,
          display_order: maxOrder,
        });
      setAssignedIds(prev => new Set(prev).add(groupId));
    }
    setSaving(false);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return t.freeOption;
    return price > 0 ? `+₼${price.toFixed(2)}` : `-₼${Math.abs(price).toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.assignModifiers}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : allGroups.length === 0 ? (
            <div className="text-center py-8">
              <Sliders className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t.noModifiers}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t.modifierLibrary}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allGroups.map(group => {
                const isAssigned = assignedIds.has(group.id);
                const options = (group.modifier_options || []).filter(o => o.is_available);
                return (
                  <button
                    key={group.id}
                    onClick={() => handleToggle(group.id)}
                    disabled={saving}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isAssigned
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        isAssigned
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isAssigned && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{group.name}</span>
                          {group.is_required && (
                            <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                              {t.required}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {group.min_select === 1 && group.max_select === 1
                            ? t.chooseOne
                            : `${t.chooseUpTo} ${group.max_select}`}
                        </p>
                        {options.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {options.slice(0, 6).map(opt => (
                              <span
                                key={opt.id}
                                className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                              >
                                {opt.name}
                                {Number(opt.price_adjustment) > 0 && (
                                  <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                                    {formatPrice(Number(opt.price_adjustment))}
                                  </span>
                                )}
                              </span>
                            ))}
                            {options.length > 6 && (
                              <span className="text-xs px-2 py-0.5 text-gray-400">
                                +{options.length - 6}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {assignedIds.size} {t.modifierGroups.toLowerCase()}
            </span>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
