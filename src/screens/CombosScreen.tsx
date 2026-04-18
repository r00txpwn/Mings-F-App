import { useCallback, useEffect, useState } from 'react';
import { Flame, Loader2, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/cockpit';

type ComboRow = {
  id: string;
  name: string;
  base_price: number;
  is_active: boolean;
  sort_order: number;
};

export function CombosScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ComboRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('combo_deals').select('*').order('sort_order', { ascending: true });
    setRows((data ?? []) as ComboRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createCombo = async () => {
    const p = Number(price);
    if (!name.trim() || Number.isNaN(p) || p < 0) return;
    await supabase.from('combo_deals').insert({
      name: name.trim(),
      base_price: p,
      is_active: true,
      sort_order: rows.length,
    });
    setName('');
    setPrice('');
    await load();
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from('combo_deals').update({ is_active: !is_active }).eq('id', id);
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return;
    await supabase.from('combo_deals').delete().eq('id', id);
    await load();
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        eyebrow={t.menuBuilder}
        title={t.combosScreenTitle}
        description={t.combosScreenDescription}
        icon={Flame}
      />

      <div className="cockpit-panel mb-6 space-y-4 p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.combosScreenGroupsHint}</p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="cockpit-label">{t.combosName}</label>
            <input
              className="cockpit-input mt-1 min-w-[200px]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.combosName}
            />
          </div>
          <div>
            <label className="cockpit-label">{t.basePrice}</label>
            <input
              className="cockpit-input mt-1 w-28"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="0"
            />
          </div>
          <button type="button" className="cockpit-btn-primary inline-flex items-center gap-2" onClick={() => void createCombo()}>
            <Plus className="h-4 w-4" />
            {t.create}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-cockpit-500" />
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-900/60"
            >
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{r.name}</p>
                <p className="font-mono text-sm text-cockpit-600 dark:text-cockpit-400">₼{Number(r.base_price).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={r.is_active} onChange={() => void toggle(r.id, r.is_active)} />
                  {t.active}
                </label>
                <button
                  type="button"
                  className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10"
                  onClick={() => void remove(r.id)}
                  aria-label={t.delete}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 ? <p className="text-slate-500">{t.combosEmpty}</p> : null}
        </div>
      )}
    </div>
  );
}
