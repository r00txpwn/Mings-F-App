import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flame, Loader2, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { adminDelete, adminInsert, adminUpdate } from '../lib/adminApi';
import { PageHeader } from '../components/cockpit';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

type ComboGroupItemRow = {
  id: string;
  menu_item_id: string;
  price_adjustment: number;
  products: { id: string; name: string } | null;
};

type ComboGroupRow = {
  id: string;
  name: string;
  required: boolean;
  sort_order: number;
  combo_group_items: ComboGroupItemRow[];
};

type ComboRow = {
  id: string;
  name: string;
  base_price: number;
  is_active: boolean;
  image_url?: string | null;
  sort_order: number;
  combo_groups: ComboGroupRow[];
};

export function CombosScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ComboRow[]>([]);
  const [products, setProducts] = useState<
    Array<{
      id: string;
      name: string;
      online_visible: boolean;
      combo_upsell_eligible: boolean;
      upsell_combo_id: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedComboId, setSelectedComboId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newItemByGroup, setNewItemByGroup] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmState, setConfirmState] = useState<{ type: 'combo' | 'group'; id: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [comboRes, productRes] = await Promise.all([
      supabase
        .from('combo_deals')
        .select(
          `id, name, base_price, is_active, image_url, sort_order,
          combo_groups(
            id, name, required, sort_order,
            combo_group_items(id, menu_item_id, price_adjustment, products(id, name))
          )`
        )
        .order('sort_order', { ascending: true }),
      supabase
        .from('products')
        .select('id, name, online_visible, combo_upsell_eligible, upsell_combo_id')
        .order('name'),
    ]);

    if (comboRes.error) {
      setLoading(false);
      console.error('[CombosScreen] load combo_deals:', comboRes.error.message);
      return;
    }
    if (productRes.error) {
      setLoading(false);
      console.error('[CombosScreen] load products:', productRes.error.message);
      return;
    }

    const combos = ((comboRes.data ?? []) as Array<Record<string, unknown>>).map((combo) => ({
      id: String(combo.id),
      name: String(combo.name ?? ''),
      base_price: Number(combo.base_price ?? 0),
      is_active: Boolean(combo.is_active),
      image_url: (combo.image_url as string | null | undefined) ?? null,
      sort_order: Number(combo.sort_order ?? 0),
      combo_groups: (((combo.combo_groups as Array<Record<string, unknown>> | undefined) ?? [])
        .map((group) => ({
          id: String(group.id),
          name: String(group.name ?? ''),
          required: group.required !== false,
          sort_order: Number(group.sort_order ?? 0),
          combo_group_items: ((group.combo_group_items as Array<Record<string, unknown>> | undefined) ?? []).map(
            (item) => {
              const productRaw = item.products as
                | { id?: string; name?: string }
                | Array<{ id?: string; name?: string }>
                | null
                | undefined;
              const product = Array.isArray(productRaw) ? productRaw[0] ?? null : (productRaw ?? null);
              return {
                id: String(item.id),
                menu_item_id: String(item.menu_item_id),
                price_adjustment: Number(item.price_adjustment ?? 0),
                products: product
                  ? {
                      id: String(product.id ?? ''),
                      name: String(product.name ?? ''),
                    }
                  : null,
              };
            }
          ),
        }))
        .sort((a, b) => a.sort_order - b.sort_order)) as ComboGroupRow[],
    }));
    setRows(combos);
    setProducts((productRes.data ?? []) as typeof products);
    setSelectedComboId((prev) => prev ?? combos[0]?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createCombo = async () => {
    const p = Number(price);
    if (!name.trim() || Number.isNaN(p) || p < 0) return;
    const result = await adminInsert('combo_deals', {
      name: name.trim(),
      base_price: p,
      is_active: true,
      sort_order: rows.length,
    });
    if (!result.ok) {
      alert(`${t.errorOccurred}: ${result.error ?? 'Failed to create combo'}`);
      return;
    }
    setName('');
    setPrice('');
    await load();
  };

  const selectedCombo = useMemo(
    () => rows.find((row) => row.id === selectedComboId) ?? null,
    [rows, selectedComboId]
  );

  const toggle = async (id: string, is_active: boolean) => {
    await adminUpdate('combo_deals', id, { is_active: !is_active });
    await load();
  };

  const updateComboField = async (id: string, patch: Partial<ComboRow>) => {
    setBusy(true);
    await adminUpdate('combo_deals', id, patch);
    setBusy(false);
    await load();
  };

  const remove = async (id: string) => {
    await adminDelete('combo_deals', id);
    if (selectedComboId === id) setSelectedComboId(null);
    await load();
  };

  const addGroup = async () => {
    if (!selectedComboId || !newGroupName.trim()) return;
    setBusy(true);
    await adminInsert('combo_groups', {
      combo_id: selectedComboId,
      name: newGroupName.trim(),
      required: true,
      selection_type: 'single',
      sort_order: selectedCombo?.combo_groups.length ?? 0,
    });
    setNewGroupName('');
    setBusy(false);
    await load();
  };

  const updateGroup = async (groupId: string, patch: Partial<ComboGroupRow>) => {
    setBusy(true);
    await adminUpdate('combo_groups', groupId, patch);
    setBusy(false);
    await load();
  };

  const removeGroup = async (groupId: string) => {
    setBusy(true);
    await adminDelete('combo_groups', groupId);
    setBusy(false);
    await load();
  };

  const addGroupItem = async (groupId: string) => {
    const productId = newItemByGroup[groupId];
    if (!productId) return;
    setBusy(true);
    await adminInsert('combo_group_items', {
      group_id: groupId,
      menu_item_id: productId,
      price_adjustment: 0,
    });
    setNewItemByGroup((prev) => ({ ...prev, [groupId]: '' }));
    setBusy(false);
    await load();
  };

  const updateGroupItem = async (groupItemId: string, patch: Partial<ComboGroupItemRow>) => {
    setBusy(true);
    await adminUpdate('combo_group_items', groupItemId, patch);
    setBusy(false);
    await load();
  };

  const removeGroupItem = async (groupItemId: string) => {
    setBusy(true);
    await adminDelete('combo_group_items', groupItemId);
    setBusy(false);
    await load();
  };

  const updateUpsellMapping = async (
    productId: string,
    patch: { combo_upsell_eligible?: boolean; upsell_combo_id?: string | null }
  ) => {
    await adminUpdate('products', productId, patch);
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
        <div className="grid gap-4 xl:grid-cols-[minmax(20rem,26rem)_1fr]">
          <div className="space-y-2">
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedComboId(r.id)}
                className={`w-full rounded-xl border p-4 text-left ${
                  selectedComboId === r.id
                    ? 'border-cockpit-500 bg-cockpit-500/10'
                    : 'border-slate-200/80 bg-white/80 dark:border-white/10 dark:bg-slate-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{r.name}</p>
                    <p className="font-mono text-sm text-cockpit-600 dark:text-cockpit-400">₼{Number(r.base_price).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">
                      {(r.combo_groups?.length ?? 0).toString()} {t.comboGroupsTitle.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <input type="checkbox" checked={r.is_active} onChange={() => void toggle(r.id, r.is_active)} />
                      {t.active}
                    </label>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10"
                      onClick={(event) => {
                        event.stopPropagation();
                        setConfirmState({ type: 'combo', id: r.id });
                      }}
                      aria-label={t.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </button>
            ))}
            {rows.length === 0 ? <p className="text-slate-500">{t.combosEmpty}</p> : null}
          </div>

          <div className="space-y-4">
            {selectedCombo ? (
              <div className="cockpit-panel space-y-4 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="cockpit-label">{t.combosName}</label>
                    <input
                      className="cockpit-input mt-1"
                      value={selectedCombo.name}
                      onChange={(event) =>
                        setRows((prev) =>
                          prev.map((row) => (row.id === selectedCombo.id ? { ...row, name: event.target.value } : row))
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="cockpit-label">{t.basePrice}</label>
                    <input
                      className="cockpit-input mt-1"
                      value={String(selectedCombo.base_price)}
                      onChange={(event) =>
                        setRows((prev) =>
                          prev.map((row) =>
                            row.id === selectedCombo.id ? { ...row, base_price: Number(event.target.value || 0) } : row
                          )
                        )
                      }
                      inputMode="decimal"
                    />
                  </div>
                  <div>
                    <label className="cockpit-label">{t.productImage}</label>
                    <input
                      className="cockpit-input mt-1"
                      value={selectedCombo.image_url ?? ''}
                      onChange={(event) =>
                        setRows((prev) =>
                          prev.map((row) => (row.id === selectedCombo.id ? { ...row, image_url: event.target.value } : row))
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="cockpit-label">{t.displayOrder}</label>
                    <input
                      className="cockpit-input mt-1"
                      value={String(selectedCombo.sort_order ?? 0)}
                      onChange={(event) =>
                        setRows((prev) =>
                          prev.map((row) =>
                            row.id === selectedCombo.id ? { ...row, sort_order: Number(event.target.value || 0) } : row
                          )
                        )
                      }
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedCombo.is_active}
                      onChange={(event) =>
                        setRows((prev) =>
                          prev.map((row) =>
                            row.id === selectedCombo.id ? { ...row, is_active: event.target.checked } : row
                          )
                        )
                      }
                    />
                    {t.active}
                  </label>
                  <button
                    type="button"
                    className="cockpit-btn-primary"
                    disabled={busy}
                    onClick={() =>
                      void updateComboField(selectedCombo.id, {
                        name: selectedCombo.name.trim(),
                        base_price: Number(selectedCombo.base_price || 0),
                        image_url: selectedCombo.image_url?.trim() || null,
                        sort_order: Number(selectedCombo.sort_order || 0),
                        is_active: selectedCombo.is_active,
                      })
                    }
                  >
                    {t.save}
                  </button>
                </div>

                <div className="space-y-3 border-t border-slate-200/80 pt-3 dark:border-white/10">
                  <h3 className="text-sm font-semibold">{t.comboGroupsTitle}</h3>
                  <div className="flex gap-2">
                    <input
                      className="cockpit-input"
                      value={newGroupName}
                      onChange={(event) => setNewGroupName(event.target.value)}
                      placeholder={t.groupName}
                    />
                    <button type="button" className="cockpit-btn-primary" disabled={busy} onClick={() => void addGroup()}>
                      {t.comboGroupAdd}
                    </button>
                  </div>

                  {selectedCombo.combo_groups.map((group) => (
                    <div
                      key={group.id}
                      className="space-y-2 rounded-xl border border-slate-200/80 bg-white/50 p-3 dark:border-white/10 dark:bg-slate-900/50"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          className="cockpit-input"
                          value={group.name}
                          onChange={(event) =>
                            setRows((prev) =>
                              prev.map((combo) =>
                                combo.id !== selectedCombo.id
                                  ? combo
                                  : {
                                      ...combo,
                                      combo_groups: combo.combo_groups.map((row) =>
                                        row.id === group.id ? { ...row, name: event.target.value } : row
                                      ),
                                    }
                              )
                            )
                          }
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={group.required}
                            onChange={(event) =>
                              setRows((prev) =>
                                prev.map((combo) =>
                                  combo.id !== selectedCombo.id
                                    ? combo
                                    : {
                                        ...combo,
                                        combo_groups: combo.combo_groups.map((row) =>
                                          row.id === group.id ? { ...row, required: event.target.checked } : row
                                        ),
                                      }
                                )
                              )
                            }
                          />
                          {t.comboGroupRequired}
                        </label>
                        <button
                          type="button"
                          className="cockpit-btn-ghost"
                          onClick={() =>
                            void updateGroup(group.id, {
                              name: group.name.trim(),
                              required: group.required,
                            })
                          }
                        >
                          {t.save}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10"
                          onClick={() => setConfirmState({ type: 'group', id: group.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-500">{t.comboItemsTitle}</p>
                        <div className="flex flex-wrap gap-2">
                          <select
                            className="cockpit-select"
                            value={newItemByGroup[group.id] ?? ''}
                            onChange={(event) =>
                              setNewItemByGroup((prev) => ({ ...prev, [group.id]: event.target.value }))
                            }
                          >
                            <option value="">{t.comboItemAdd}</option>
                            {products
                              .filter((product) => !group.combo_group_items.some((row) => row.menu_item_id === product.id))
                              .map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                          </select>
                          <button type="button" className="cockpit-btn-ghost" onClick={() => void addGroupItem(group.id)}>
                            {t.add}
                          </button>
                        </div>

                        {group.combo_group_items.map((item) => (
                          <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-100/70 p-2 dark:bg-slate-800/60">
                            <span className="min-w-[10rem] text-sm">{item.products?.name ?? '—'}</span>
                            <input
                              className="cockpit-input w-28"
                              value={String(item.price_adjustment ?? 0)}
                              onChange={(event) =>
                                setRows((prev) =>
                                  prev.map((combo) =>
                                    combo.id !== selectedCombo.id
                                      ? combo
                                      : {
                                          ...combo,
                                          combo_groups: combo.combo_groups.map((groupRow) =>
                                            groupRow.id !== group.id
                                              ? groupRow
                                              : {
                                                  ...groupRow,
                                                  combo_group_items: groupRow.combo_group_items.map((itemRow) =>
                                                    itemRow.id === item.id
                                                      ? { ...itemRow, price_adjustment: Number(event.target.value || 0) }
                                                      : itemRow
                                                  ),
                                                }
                                          ),
                                        }
                                  )
                                )
                              }
                              inputMode="decimal"
                            />
                            <span className="text-xs text-slate-500">{t.comboItemPriceAdjustment}</span>
                            <button
                              type="button"
                              className="cockpit-btn-ghost"
                              onClick={() =>
                                void updateGroupItem(item.id, { price_adjustment: Number(item.price_adjustment || 0) })
                              }
                            >
                              {t.save}
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10"
                              onClick={() => void removeGroupItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="cockpit-panel space-y-3 p-4">
              <h3 className="text-sm font-semibold">{t.comboUpsellLink}</h3>
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-white/10 dark:bg-slate-900/50"
                  >
                    <span className="min-w-[12rem] text-sm">{product.name}</span>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={product.combo_upsell_eligible}
                        onChange={(event) =>
                          void updateUpsellMapping(product.id, {
                            combo_upsell_eligible: event.target.checked,
                            upsell_combo_id: event.target.checked ? product.upsell_combo_id : null,
                          })
                        }
                      />
                      {t.active}
                    </label>
                    <select
                      className="cockpit-select"
                      value={product.upsell_combo_id ?? ''}
                      disabled={!product.combo_upsell_eligible}
                      onChange={(event) =>
                        void updateUpsellMapping(product.id, {
                          upsell_combo_id: event.target.value || null,
                        })
                      }
                    >
                      <option value="">{t.comboUpsellNone}</option>
                      {rows.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmState !== null}
        title={t.delete}
        message={t.confirmDelete}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          if (!confirmState) return;
          const state = confirmState;
          setConfirmState(null);
          if (state.type === 'combo') {
            void remove(state.id);
            return;
          }
          void removeGroup(state.id);
        }}
      />
    </div>
  );
}
