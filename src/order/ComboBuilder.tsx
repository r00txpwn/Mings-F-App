import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { OrderCartLine } from '../types/orderCart';

export type ComboGroupRow = {
  id: string;
  name: string;
  required: boolean;
  sort_order: number;
  combo_group_items: Array<{
    id: string;
    menu_item_id: string;
    products: {
      id: string;
      name: string;
      selling_price: number;
      modifier_groups?: Array<{
        id: string;
        name: string;
        min_select: number;
        max_select: number;
        is_required: boolean;
        display_order: number;
        modifier_options?: Array<{
          id: string;
          name: string;
          price_adjustment: number;
          is_available: boolean;
          is_default: boolean;
          display_order: number;
        }>;
      }>;
    } | null;
  }>;
};

export type ComboDealRow = {
  id: string;
  name: string;
  base_price: number;
  image_url?: string | null;
  combo_groups: ComboGroupRow[];
};

type ComboModifierGroup = NonNullable<
  NonNullable<ComboGroupRow['combo_group_items'][number]['products']>['modifier_groups']
>[number];
type ComboModifierOption = NonNullable<ComboModifierGroup['modifier_options']>[number];

interface ComboBuilderProps {
  combo: ComboDealRow;
  labels: {
    header: string;
    back: string;
    stepOf: string;
    addToCart: string;
    nextStep: string;
    pickOne: string;
  };
  onBack: () => void;
  onAddToCart: (line: Omit<Extract<OrderCartLine, { kind: 'combo' }>, 'cartItemKey'>) => void;
}

export function ComboBuilder({ combo, labels, onBack, onAddToCart }: ComboBuilderProps) {
  const groups = useMemo(
    () => [...(combo.combo_groups ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [combo.combo_groups]
  );

  const [step, setStep] = useState(0);
  const [selectionState, setSelectionState] = useState<
    Record<
      string,
      {
        itemId: string;
        groupName: string;
        itemName: string;
        modifierOptionIds: string[];
        modifierNames: string[];
      }
    >
  >({});
  const g = groups[step];
  const canNext = g ? Boolean(selectionState[g.id]) : false;

  const sortedStepItems = useMemo(() => {
    return (g?.combo_group_items ?? []).filter((row) => row.products);
  }, [g?.combo_group_items]);

  const getDefaultModifiers = (
    product:
      | {
          modifier_groups?: Array<{
            id: string;
            max_select: number;
            modifier_options?: Array<{ id: string; name: string; is_default: boolean; is_available: boolean }>;
          }>;
        }
      | null
      | undefined
  ) => {
    const modifierOptionIds: string[] = [];
    const modifierNames: string[] = [];
    for (const group of product?.modifier_groups ?? []) {
      const defaults = (group.modifier_options ?? [])
        .filter((opt) => opt.is_available !== false && opt.is_default)
        .slice(0, Math.max(0, Number(group.max_select ?? 1)));
      for (const opt of defaults) {
        modifierOptionIds.push(opt.id);
        modifierNames.push(opt.name);
      }
    }
    return { modifierOptionIds, modifierNames };
  };

  useEffect(() => {
    if (!g) return;
    if (selectionState[g.id]) return;
    const first = sortedStepItems[0];
    if (!first?.products) return;
    const defaults = getDefaultModifiers(first.products);
    setSelectionState((prev) => ({
      ...prev,
      [g.id]: {
        itemId: first.menu_item_id,
        groupName: g.name,
        itemName: first.products?.name ?? '',
        modifierOptionIds: defaults.modifierOptionIds,
        modifierNames: defaults.modifierNames,
      },
    }));
  }, [g, selectionState, sortedStepItems]);

  const pickItem = (
    groupId: string,
    itemId: string,
    groupName: string,
    itemName: string,
    product: ComboGroupRow['combo_group_items'][number]['products']
  ) => {
    const defaults = getDefaultModifiers(product);
    setSelectionState((prev) => ({
      ...prev,
      [groupId]: {
        itemId,
        groupName,
        itemName,
        modifierOptionIds: defaults.modifierOptionIds,
        modifierNames: defaults.modifierNames,
      },
    }));
  };

  const selectedStepItem = useMemo(() => {
    if (!g) return null;
    const selectedItemId = selectionState[g.id]?.itemId;
    if (!selectedItemId) return null;
    return (g.combo_group_items ?? []).find((row) => row.menu_item_id === selectedItemId)?.products ?? null;
  }, [g, selectionState]);

  const toggleModifier = (
    modifierGroup: ComboModifierGroup,
    option: ComboModifierOption
  ) => {
    if (!g || !selectedStepItem) return;
    const current = selectionState[g.id];
    if (!current) return;

    const optionsByGroup = new Map<string, string[]>();
    for (const mg of selectedStepItem.modifier_groups ?? []) {
      optionsByGroup.set(
        mg.id,
        current.modifierOptionIds.filter((id) => (mg.modifier_options ?? []).some((opt) => opt.id === id))
      );
    }

    const selectedForGroup = optionsByGroup.get(modifierGroup.id) ?? [];
    const isSelected = selectedForGroup.includes(option.id);
    const max = Math.max(1, Number(modifierGroup.max_select ?? 1));
    let nextForGroup = selectedForGroup;

    if (max === 1) {
      nextForGroup = [option.id];
    } else if (isSelected) {
      nextForGroup = selectedForGroup.filter((id) => id !== option.id);
    } else if (selectedForGroup.length < max) {
      nextForGroup = [...selectedForGroup, option.id];
    } else {
      return;
    }

    optionsByGroup.set(modifierGroup.id, nextForGroup);
    const nextIds = Array.from(optionsByGroup.values()).flat();
    const nextNames = nextIds
      .map((id) =>
        (selectedStepItem.modifier_groups ?? [])
          .flatMap((group) => group.modifier_options ?? [])
          .find((opt) => opt.id === id)?.name
      )
      .filter((name): name is string => Boolean(name));

    setSelectionState((prev) => ({
      ...prev,
      [g.id]: {
        ...current,
        modifierOptionIds: nextIds,
        modifierNames: nextNames,
      },
    }));
  };

  const handleNext = () => {
    if (step < groups.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    const selList = groups.map((gr) => {
      const row = selectionState[gr.id];
      if (!row) throw new Error('missing');
      return {
        groupId: gr.id,
        itemId: row.itemId,
        groupName: row.groupName,
        itemName: row.itemName,
        modifierOptionIds: row.modifierOptionIds,
        modifierNames: row.modifierNames,
      };
    });
    onAddToCart({
      kind: 'combo',
      comboId: combo.id,
      comboName: combo.name,
      basePrice: Number(combo.base_price),
      quantity: 1,
      selections: selList,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-white/10 bg-slate-950/95 px-3 py-3 backdrop-blur">
        <button type="button" onClick={onBack} className="rounded-lg p-2 hover:bg-white/5" aria-label={labels.back}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{combo.name}</p>
          <p className="text-[11px] text-slate-500">
            {labels.stepOf.replace('{n}', String(step + 1)).replace('{t}', String(groups.length))}
          </p>
        </div>
        <p className="font-mono text-cockpit-400">₼{Number(combo.base_price).toFixed(2)}</p>
      </header>

      <div className="flex-1 space-y-3 p-4">
        {g ? (
          <>
            <h2 className="text-lg font-semibold text-white">{g.name}</h2>
            <p className="text-xs text-slate-500">{labels.pickOne}</p>
            <div className="space-y-2">
              {sortedStepItems.map((row) => {
                const p = row.products;
                if (!p) return null;
                const active = selectionState[g.id]?.itemId === row.menu_item_id;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => pickItem(g.id, row.menu_item_id, g.name, p.name, p)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                      active
                        ? 'border-cockpit-500 bg-cockpit-600/20 text-white'
                        : 'border-white/10 bg-slate-900/80 hover:border-cockpit-500/40'
                    }`}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-slate-500">₼{Number(p.selling_price).toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
            {selectedStepItem?.modifier_groups && selectedStepItem.modifier_groups.length > 0 ? (
              <div className="mt-4 space-y-3">
                {selectedStepItem.modifier_groups
                  .filter((modifierGroup) => (modifierGroup.modifier_options ?? []).some((opt) => opt.is_available !== false))
                  .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                  .map((modifierGroup) => {
                    const selectedIds = selectionState[g.id]?.modifierOptionIds ?? [];
                    const selectedInGroup = selectedIds.filter((id) =>
                      (modifierGroup.modifier_options ?? []).some((opt) => opt.id === id)
                    );
                    const max = Math.max(1, Number(modifierGroup.max_select ?? 1));
                    return (
                      <div key={modifierGroup.id} className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                        <p className="text-sm font-semibold text-white">{modifierGroup.name}</p>
                        <p className="text-xs text-slate-500">
                          {max === 1 ? labels.pickOne : `${labels.pickOne} (${selectedInGroup.length}/${max})`}
                        </p>
                        <div className="mt-2 space-y-2">
                          {(modifierGroup.modifier_options ?? [])
                            .filter((opt) => opt.is_available !== false)
                            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                            .map((opt) => {
                              const active = selectedIds.includes(opt.id);
                              const atLimit = !active && max > 1 && selectedInGroup.length >= max;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  disabled={atLimit}
                                  onClick={() => toggleModifier(modifierGroup, opt)}
                                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                    active
                                      ? 'border-cockpit-500 bg-cockpit-600/20 text-white'
                                      : 'border-white/10 text-slate-300 hover:border-cockpit-500/40'
                                  } ${atLimit ? 'opacity-40' : ''}`}
                                >
                                  <span>{opt.name}</span>
                                  <span className="font-mono text-xs text-slate-500">
                                    {Number(opt.price_adjustment) > 0
                                      ? `+₼${Number(opt.price_adjustment).toFixed(2)}`
                                      : Number(opt.price_adjustment) < 0
                                        ? `-₼${Math.abs(Number(opt.price_adjustment)).toFixed(2)}`
                                        : '₼0.00'}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-slate-500">—</p>
        )}
      </div>

      <div className="border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          disabled={!canNext}
          onClick={() => void handleNext()}
          className="neon-btn-primary w-full py-4 disabled:opacity-40"
        >
          {step < groups.length - 1 ? labels.nextStep : labels.addToCart}
        </button>
      </div>
    </div>
  );
}
