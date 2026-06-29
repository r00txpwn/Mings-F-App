import { useState, useEffect } from 'react';
import { Check, Loader2, Sliders } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { supabase, Product, ModifierGroup } from '../lib/supabase';
import { adminInsert, adminMutate } from '../lib/adminApi';
import { Modal } from './ui/Modal';
import { EmptyState } from './ui/EmptyState';
import { Skeleton } from './ui/Skeleton';

interface ProductModifierAssignerProps {
  product: Product;
  onClose: () => void;
}

export function ProductModifierAssigner({ product, onClose }: ProductModifierAssignerProps) {
  const { t } = useLanguage();
  const toast = useToast();
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
    if (saving) return;
    setSaving(true);
    const isAssigned = assignedIds.has(groupId);

    if (isAssigned) {
      const result = await adminMutate({
        table: 'product_modifier_groups',
        operation: 'delete',
        match: { product_id: product.id, modifier_group_id: groupId },
      });
      if (!result.ok) {
        toast.error(result.error ?? t.errorOccurred);
        setSaving(false);
        return;
      }
      setAssignedIds(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    } else {
      const maxOrder = assignedIds.size;
      const result = await adminInsert('product_modifier_groups', {
        product_id: product.id,
        modifier_group_id: groupId,
        display_order: maxOrder,
      });
      if (!result.ok) {
        toast.error(result.error ?? t.errorOccurred);
        setSaving(false);
        return;
      }
      setAssignedIds(prev => new Set(prev).add(groupId));
    }
    setSaving(false);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return t.freeOption;
    return price > 0 ? `+₼${price.toFixed(2)}` : `-₼${Math.abs(price).toFixed(2)}`;
  };

  return (
    <Modal
      open
      onClose={onClose}
      titleId="modifier-assigner-title"
      title={t.assignModifiers}
      subtitle={product.name}
      widthClassName="max-w-lg"
      contentClassName="p-0"
    >
      <div className="-m-5 flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label={t.cockpitLoadingContent}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : allGroups.length === 0 ? (
            <EmptyState icon={Sliders} title={t.noModifiers} description={t.modifierLibrary} className="border-0 bg-transparent py-8" />
          ) : (
            <div className="space-y-3">
              {allGroups.map(group => {
                const isAssigned = assignedIds.has(group.id);
                const options = (group.modifier_options || []).filter(o => o.is_available);
                return (
                  <button
                    key={group.id}
                    onClick={() => void handleToggle(group.id)}
                    disabled={saving}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      isAssigned
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isAssigned
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isAssigned && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">{group.name}</span>
                          {group.is_required && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
                              {t.required}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {group.min_select === 1 && group.max_select === 1
                            ? t.chooseOne
                            : `${t.chooseUpTo} ${group.max_select}`}
                        </p>
                        {options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {options.slice(0, 6).map(opt => (
                              <span
                                key={opt.id}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                              >
                                {opt.name}
                                {Number(opt.price_adjustment) > 0 && (
                                  <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                                    {formatPrice(Number(opt.price_adjustment))}
                                  </span>
                                )}
                              </span>
                            ))}
                            {options.length > 6 && (
                              <span className="px-2 py-0.5 text-xs text-slate-400">
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

        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-5 py-4 dark:border-white/10">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {assignedIds.size} {t.modifierGroups.toLowerCase()}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cockpit-btn-primary px-6"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t.save}
          </button>
        </div>
      </div>
    </Modal>
  );
}
