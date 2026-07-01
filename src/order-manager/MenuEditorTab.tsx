import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { adminUpdate } from '../lib/adminApi';

type MenuEditorMode = 'products' | 'combos';

interface ProductRow {
  id: string;
  name: string;
  selling_price: number;
  kiosk_visible: boolean;
  online_visible: boolean;
  master_category_id: string | null;
}

interface ComboRow {
  id: string;
  name: string;
  base_price: number;
  is_active: boolean;
}

export function MenuEditorTab() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<MenuEditorMode>('products');
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [combos, setCombos] = useState<ComboRow[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [err, setErr] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [productRes, comboRes, catRes] = await Promise.all([
      supabase.from('products').select('id, name, selling_price, kiosk_visible, online_visible, master_category_id').order('name'),
      supabase.from('combo_deals').select('id, name, base_price, is_active').order('sort_order'),
      supabase.from('master_categories').select('id, name').order('name'),
    ]);
    setProducts((productRes.data ?? []) as ProductRow[]);
    setCombos((comboRes.data ?? []) as ComboRow[]);
    setCategories((catRes.data ?? []) as Array<{ id: string; name: string }>);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, ProductRow[]>();
    for (const product of products) {
      const key = product.master_category_id ?? 'uncategorized';
      const list = map.get(key) ?? [];
      list.push(product);
      map.set(key, list);
    }
    return map;
  }, [products]);

  const categoryName = useCallback(
    (id: string) => {
      if (id === 'uncategorized') return t.none;
      return categories.find((c) => c.id === id)?.name ?? t.none;
    },
    [categories, t.none]
  );

  const toggleProduct = async (id: string, patch: Partial<Pick<ProductRow, 'kiosk_visible' | 'online_visible'>>) => {
    setSavingId(id);
    setErr(null);
    const result = await adminUpdate('products', id, patch);
    setSavingId(null);
    if (!result.ok) {
      setErr(result.error ?? t.omMenuEditorUpdateFailed);
      return;
    }
    await load();
  };

  const toggleCombo = async (id: string, isActive: boolean) => {
    setSavingId(id);
    setErr(null);
    const result = await adminUpdate('combo_deals', id, { is_active: !isActive });
    setSavingId(null);
    if (!result.ok) {
      setErr(result.error ?? t.omMenuEditorUpdateFailed);
      return;
    }
    await load();
  };

  return (
    <div className="space-y-3">
      {err ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100" role="alert">
          {err}
        </p>
      ) : null}
      <div className="inline-flex rounded-lg bg-white/5 p-0.5 text-sm">
        <button
          type="button"
          onClick={() => setMode('products')}
          className={`rounded-md px-3 py-1.5 ${mode === 'products' ? 'bg-cockpit-500 text-white' : 'text-slate-300'}`}
        >
          {t.omProducts}
        </button>
        <button
          type="button"
          onClick={() => setMode('combos')}
          className={`rounded-md px-3 py-1.5 ${mode === 'combos' ? 'bg-cockpit-500 text-white' : 'text-slate-300'}`}
        >
          {t.omCombos}
        </button>
      </div>

      {mode === 'products' ? (
        <div className="space-y-3">
          {Array.from(grouped.entries())
            .sort((a, b) => categoryName(a[0]).localeCompare(categoryName(b[0])))
            .map(([categoryId, rows]) => (
              <section key={categoryId} className="cockpit-panel rounded-xl p-3">
                <h3 className="mb-2 text-sm font-bold text-cockpit-300">{categoryName(categoryId)}</h3>
                <div className="space-y-2">
                  {rows.map((row) => (
                    <div
                      key={row.id}
                      className={`grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border p-2 ${
                        row.kiosk_visible || row.online_visible
                          ? 'border-white/10 bg-white/5'
                          : 'border-white/10 bg-slate-900/50 opacity-60'
                      }`}
                    >
                      <div>
                        <p className="text-sm text-white">{row.name}</p>
                        <p className="text-xs text-slate-400">₼{Number(row.selling_price ?? 0).toFixed(2)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={savingId === row.id}
                        onClick={() => void toggleProduct(row.id, { kiosk_visible: !row.kiosk_visible })}
                        className={`rounded-md px-2 py-1 text-xs font-semibold disabled:opacity-50 ${
                          row.kiosk_visible ? 'bg-emerald-500/30 text-emerald-100' : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {t.omKioskToggle}
                      </button>
                      <button
                        type="button"
                        disabled={savingId === row.id}
                        onClick={() => void toggleProduct(row.id, { online_visible: !row.online_visible })}
                        className={`rounded-md px-2 py-1 text-xs font-semibold disabled:opacity-50 ${
                          row.online_visible ? 'bg-cockpit-500/35 text-cockpit-100' : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {t.omOnlineToggle}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </div>
      ) : (
        <div className="space-y-2">
          {combos.map((combo) => (
            <article key={combo.id} className="neon-card flex items-center justify-between rounded-xl border border-white/10 p-3">
              <div>
                <p className="text-sm font-semibold text-white">{combo.name}</p>
                <p className="text-xs text-slate-400">₼{Number(combo.base_price ?? 0).toFixed(2)}</p>
              </div>
              <button
                type="button"
                disabled={savingId === combo.id}
                onClick={() => void toggleCombo(combo.id, combo.is_active)}
                className={`rounded-md px-3 py-1 text-xs font-semibold disabled:opacity-50 ${
                  combo.is_active ? 'bg-emerald-500/30 text-emerald-100' : 'bg-white/10 text-slate-300'
                }`}
              >
                {t.omActiveToggle}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
