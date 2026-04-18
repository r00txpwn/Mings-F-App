import { useMemo, useState } from 'react';
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
    products: { id: string; name: string; selling_price: number } | null;
  }>;
};

export type ComboDealRow = {
  id: string;
  name: string;
  base_price: number;
  image_url?: string | null;
  combo_groups: ComboGroupRow[];
};

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
  const [selections, setSelections] = useState<
    Record<string, { itemId: string; groupName: string; itemName: string }>
  >({});

  const g = groups[step];
  const canNext = g ? Boolean(selections[g.id]) : false;

  const pickItem = (groupId: string, itemId: string, groupName: string, itemName: string) => {
    setSelections((prev) => ({ ...prev, [groupId]: { itemId, groupName, itemName } }));
  };

  const handleNext = () => {
    if (step < groups.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    const selList = groups.map((gr) => {
      const row = selections[gr.id];
      if (!row) throw new Error('missing');
      return {
        groupId: gr.id,
        itemId: row.itemId,
        groupName: row.groupName,
        itemName: row.itemName,
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
              {(g.combo_group_items ?? []).map((row) => {
                const p = row.products;
                if (!p) return null;
                const active = selections[g.id]?.itemId === row.menu_item_id;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => pickItem(g.id, row.menu_item_id, g.name, p.name)}
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
